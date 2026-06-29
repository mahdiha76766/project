import mongoose from 'mongoose';
import { FinancePayment, Invoice } from '@/models';
import { env } from '@/server/config/env';
import { writeAuditLog } from '@/lib/finance/audit';
import { generateResNum } from '@/lib/finance/ids';
import { notifyPaymentStatus } from '@/lib/finance/notification-service';
import { captureHold, deposit, hold, releaseHold } from '@/lib/finance/wallet-service';
import { issueFormalInvoice, getInvoiceByNumber } from '@/lib/invoice/invoice-service';
import { getPaymentGateway, getPaymentGatewayByName } from '@/lib/payment/gateway-factory';
import { checkPaymentIdempotency, findExistingPaymentByKey } from '@/lib/payment/idempotency';
import { activateAfterPayment } from '@/lib/saas/activation-service';
import { runInTransaction } from '@/lib/db/transaction';

export type PayMethod = 'wallet' | 'gateway' | 'mixed';

function paymentResultUrl(invoiceNumber: string, status: 'paid' | 'failed') {
  const params = new URLSearchParams({ invoiceNumber, status });
  return `/payment/result?${params.toString()}`;
}

export type PayInvoiceParams = {
  userId: string;
  invoiceNumber: string;
  method: PayMethod;
  idempotencyKey?: string;
  mobile?: string;
  ip?: string;
};

function splitAmount(total: number, method: PayMethod, walletAvailable: number) {
  if (method === 'wallet') {
    if (walletAvailable < total) throw new Error('موجودی کیف پول کافی نیست');
    return { walletAmount: total, gatewayAmount: 0 };
  }
  if (method === 'gateway') return { walletAmount: 0, gatewayAmount: total };
  const walletAmount = Math.min(walletAvailable, total);
  const gatewayAmount = total - walletAmount;
  if (gatewayAmount > 0 && walletAmount === 0) return { walletAmount: 0, gatewayAmount: total };
  return { walletAmount, gatewayAmount };
}

async function appendActivity(paymentId: string, action: string, message: string, metadata?: Record<string, unknown>) {
  await FinancePayment.updateOne(
    { _id: paymentId },
    { $push: { activityLog: { action, message, metadata, performedAt: new Date() } } }
  );
}

export async function payInvoice(params: PayInvoiceParams) {
  if (params.idempotencyKey) {
    const existing = await findExistingPaymentByKey(params.idempotencyKey);
    if (existing) {
      if (existing.status === 'PAID') {
        return {
          payment: existing,
          redirectUrl: null,
          alreadyProcessed: true
        };
      }
      if (existing.status === 'PENDING' && existing.gatewayAmount > 0) {
        const gateway = getPaymentGatewayByName(existing.provider);
        const callbackUrl = `${env.APP_BASE_URL}/api/payment/verify`;
        const initiated = await gateway.initiate({
          resNum: existing.resNum,
          amount: existing.gatewayAmount,
          callbackUrl,
          mobile: params.mobile,
          description: `پرداخت فاکتور ${existing.invoiceNumber}`
        });
        return { payment: existing, redirectUrl: initiated.redirectUrl, alreadyProcessed: false };
      }
    }
  }

  const invoice = await getInvoiceByNumber(params.invoiceNumber);
  if (String(invoice.user) !== params.userId) throw new Error('دسترسی به فاکتور مجاز نیست');
  if (invoice.status === 'paid') throw new Error('فاکتور قبلاً پرداخت شده است');
  if (invoice.status === 'cancelled') throw new Error('فاکتور لغو شده است');
  if (invoice.expiresAt && invoice.expiresAt < new Date()) throw new Error('مهلت پرداخت فاکتور به پایان رسیده است');

  const { getOrCreateWallet } = await import('@/lib/finance/wallet-service');
  const wallet = await getOrCreateWallet(params.userId);
  const { walletAmount, gatewayAmount } = splitAmount(invoice.total, params.method, wallet.availableBalance);

  const resNum = generateResNum();
  const provider = env.NODE_ENV === 'production' ? 'SEP' : 'MOCK';
  let payment!: InstanceType<typeof FinancePayment>;
  let holdId: string | undefined;

  await runInTransaction(async (session) => {
    if (walletAmount > 0) {
      const holdResult = await hold(
        params.userId,
        walletAmount,
        {
          reason: `پرداخت فاکتور ${invoice.invoiceNumber}`,
          referenceType: 'invoice',
          referenceId: String(invoice._id),
          expiresAt: invoice.expiresAt ?? undefined
        },
        { session }
      );
      holdId = String(holdResult.hold._id);
    }

    const [created] = await FinancePayment.create(
      [
        {
          resNum,
          amount: invoice.total,
          baseAmount: invoice.subtotal,
          tax: invoice.tax,
          status: 'PENDING',
          userId: params.userId,
          paymentType: invoice.type,
          invoiceNumber: invoice.invoiceNumber,
          provider,
          orderId: invoice.type === 'order' ? invoice.relatedEntity?.id : undefined,
          walletAmount,
          gatewayAmount,
          idempotencyKey: params.idempotencyKey,
          holdId,
          activityLog: [{ action: 'created', message: 'ایجاد پرداخت', performedAt: new Date() }]
        }
      ],
      session ? { session } : undefined
    );
    payment = created;
  });

  if (gatewayAmount === 0) {
    return finalizeSuccessfulPayment({
      resNum: payment.resNum,
      refNum: `WALLET-${payment.resNum}`,
      affectiveAmount: 0,
      ip: params.ip
    });
  }

  const gateway = getPaymentGateway();
  const callbackUrl = `${env.APP_BASE_URL}/api/payment/verify`;
  const initiated = await gateway.initiate({
    resNum: payment.resNum,
    amount: gatewayAmount,
    callbackUrl,
    mobile: params.mobile,
    description: `پرداخت فاکتور ${invoice.invoiceNumber}`
  });
  await appendActivity(String(payment._id), 'gateway_redirect', 'هدایت به درگاه', { redirectUrl: initiated.redirectUrl });

  return { payment, redirectUrl: initiated.redirectUrl, alreadyProcessed: false };
}

export async function finalizeSuccessfulPayment(params: {
  resNum: string;
  refNum?: string;
  affectiveAmount?: number;
  gatewayPayload?: unknown;
  ip?: string;
}) {
  const idem = await checkPaymentIdempotency(params.resNum);
  if (idem.alreadyProcessed && idem.payment) {
    return {
      success: true,
      alreadyProcessed: true,
      payment: idem.payment,
      redirectUrl: paymentResultUrl(idem.payment.invoiceNumber, 'paid')
    };
  }

  const payment = idem.payment;
  if (!payment) throw new Error('پرداخت یافت نشد');

  if (payment.gatewayAmount > 0) {
    const expected = payment.gatewayAmount;
    const actual = params.affectiveAmount ?? expected;
    if (actual !== expected) {
      await markPaymentFailed(payment.resNum, 'مبلغ پرداختی با مبلغ فاکتور مطابقت ندارد', params);
      throw new Error('مبلغ پرداختی با مبلغ فاکتور مطابقت ندارد');
    }
  }

  await runInTransaction(async (session) => {
    const fresh = await FinancePayment.findOne({ resNum: params.resNum }).session(session ?? null);
    if (!fresh) throw new Error('پرداخت یافت نشد');
    if (fresh.status === 'PAID') return;

    if (fresh.holdId) {
      await captureHold(String(fresh.holdId), {
        description: `پرداخت فاکتور ${fresh.invoiceNumber}`,
        referenceType: 'invoice'
      }, { session });
    }

    if (fresh.paymentType === 'wallet_topup') {
      await deposit(
        String(fresh.userId),
        fresh.amount,
        {
          referenceType: 'payment',
          referenceId: String(fresh._id),
          description: 'شارژ کیف پول'
        },
        { session }
      );
    }

    fresh.status = 'PAID';
    fresh.refNum = params.refNum ?? fresh.refNum;
    fresh.verifiedAt = new Date();
    fresh.gatewayPayload = params.gatewayPayload;
    fresh.activityLog.push({
      action: 'verified',
      message: 'پرداخت تأیید شد',
      performedAt: new Date()
    });
    await fresh.save({ session });

    const invoice = await Invoice.findOne({ invoiceNumber: fresh.invoiceNumber }).session(session ?? null);
    if (!invoice) throw new Error('فاکتور یافت نشد');
    await issueFormalInvoice(fresh.invoiceNumber, String(fresh._id), session);

    if (fresh.paymentType !== 'wallet_topup') {
      await activateAfterPayment(
        fresh.paymentType as import('@/constants/invoice').InvoiceType,
        {
          userId: String(fresh.userId),
          invoiceNumber: fresh.invoiceNumber,
          invoiceId: String(invoice._id),
          relatedEntity: invoice.relatedEntity
            ? { type: invoice.relatedEntity.type, id: String(invoice.relatedEntity.id) }
            : undefined
        },
        session
      );
    }

    await writeAuditLog({
      actor: String(fresh.userId),
      action: 'payment.verified',
      entityType: 'FinancePayment',
      entityId: String(fresh._id),
      metadata: { resNum: fresh.resNum, refNum: fresh.refNum, amount: fresh.amount },
      ip: params.ip,
      session
    });
  });

  const updated = await FinancePayment.findOne({ resNum: params.resNum });
  if (updated) {
    await notifyPaymentStatus(String(updated.userId), 'PAID', updated.invoiceNumber);
  }

  return {
    success: true,
    alreadyProcessed: false,
    payment: updated,
    redirectUrl: paymentResultUrl(updated?.invoiceNumber ?? payment.invoiceNumber, 'paid')
  };
}

export async function markPaymentFailed(resNum: string, reason: string, params?: { gatewayPayload?: unknown; ip?: string }) {
  const payment = await FinancePayment.findOne({ resNum });
  if (!payment || payment.status === 'PAID') return payment;

  if (payment.holdId) {
    await releaseHold(String(payment.holdId));
  }

  payment.status = 'FAILED';
  payment.gatewayPayload = params?.gatewayPayload;
  payment.activityLog.push({ action: 'failed', message: reason, performedAt: new Date() });
  await payment.save();

  await notifyPaymentStatus(String(payment.userId), 'FAILED', payment.invoiceNumber);
  await writeAuditLog({
    actor: String(payment.userId),
    action: 'payment.failed',
    entityType: 'FinancePayment',
    entityId: String(payment._id),
    metadata: { resNum, reason },
    ip: params?.ip
  });

  return payment;
}

export async function verifyPaymentFromCallback(query: Record<string, string>, ip?: string) {
  const resNum = query.ResNum ?? query.resNum;
  if (!resNum) throw new Error('ResNum موجود نیست');

  const idem = await checkPaymentIdempotency(resNum);
  if (idem.alreadyProcessed && idem.payment) {
    return {
      success: true,
      alreadyProcessed: true,
      payment: idem.payment,
      redirectUrl: paymentResultUrl(idem.payment.invoiceNumber, 'paid')
    };
  }

  const payment = idem.payment;
  if (!payment) throw new Error('پرداخت یافت نشد');

  const gateway = getPaymentGatewayByName(payment.provider);
  const verifyResult = await gateway.verify({
    resNum,
    refNum: query.RefNum ?? query.refNum,
    state: query.State ?? query.state,
    amount: payment.gatewayAmount,
    raw: query
  });

  if (!verifyResult.success) {
    await markPaymentFailed(resNum, verifyResult.message ?? 'پرداخت ناموفق', { gatewayPayload: verifyResult.raw, ip });
    return {
      success: false,
      redirectUrl: paymentResultUrl(payment.invoiceNumber, 'failed')
    };
  }

  const result = await finalizeSuccessfulPayment({
    resNum,
    refNum: verifyResult.refNum,
    affectiveAmount: verifyResult.affectiveAmount,
    gatewayPayload: verifyResult.raw,
    ip
  });

  return result;
}

export async function getReceiptByInvoice(invoiceNumber: string, userId: string) {
  const payment = await FinancePayment.findOne({ invoiceNumber, status: 'PAID' })
    .sort({ verifiedAt: -1 })
    .lean() as { userId: unknown; invoiceNumber: string; amount: number; status: string; paymentType: string; verifiedAt?: Date; refNum?: string } | null;
  if (!payment) throw new Error('رسید یافت نشد');
  if (String(payment.userId) !== userId) throw new Error('دسترسی مجاز نیست');
  const invoice = await Invoice.findOne({ invoiceNumber }).lean();
  return { payment, invoice };
}
