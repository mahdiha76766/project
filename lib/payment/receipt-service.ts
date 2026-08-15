import 'server-only';

import { Invoice, Order, PaymentReceipt, FinancePayment } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getCardToCardSettings } from '@/lib/admin/card-to-card-settings';
import { savePaymentReceiptImage, deleteReceiptFile } from '@/lib/payment/receipt-upload';
import { activateAfterPayment } from '@/lib/saas/activation-service';
import { deposit, hold, captureHold, releaseHold } from '@/lib/finance/wallet-service';
import { notifyOrderStatus } from '@/lib/finance/notification-service';
import { issueFormalInvoice } from '@/lib/invoice/invoice-service';

export async function createPaymentReceipt(params: {
  userId: string;
  type: 'order' | 'wallet_topup';
  invoiceNumber: string;
  orderId?: string;
  amount: number;
  file: File;
  useWallet?: boolean;
}) {
  const settings = await getCardToCardSettings();
  if (!settings.enabled) throw new Error('پرداخت کارت به کارت غیرفعال است');

  await connectToDatabase();

  const existing = await PaymentReceipt.findOne({
    user: params.userId,
    invoiceNumber: params.invoiceNumber,
    status: { $in: ['PENDING', 'APPROVED'] }
  });
  if (existing) throw new Error('رسید قبلاً برای این فاکتور ثبت شده است');

  const rejectCount = await PaymentReceipt.countDocuments({
    invoiceNumber: params.invoiceNumber,
    status: 'REJECTED'
  });
  if (rejectCount >= 2) {
    throw new Error('به دلیل رد شدن ۲ بار رسید ارسالی برای این سفارش، امکان ارسال مجدد رسید وجود ندارد و سفارش قفل شده است.');
  }

  const invoice = await Invoice.findOne({ invoiceNumber: params.invoiceNumber, user: params.userId });
  if (!invoice) throw new Error('فاکتور یافت نشد');

  const { getOrCreateWallet } = await import('@/lib/finance/wallet-service');
  const wallet = await getOrCreateWallet(params.userId);

  let walletAmount = 0;
  let gatewayAmount = invoice.total;
  let holdId: string | undefined;

  if (params.useWallet && wallet.availableBalance > 0) {
    walletAmount = Math.min(wallet.availableBalance, invoice.total);
    gatewayAmount = invoice.total - walletAmount;

    if (walletAmount > 0) {
      const holdResult = await hold(
        params.userId,
        walletAmount,
        {
          reason: `پیش‌پرداخت فاکتور ${invoice.invoiceNumber}`,
          referenceType: 'invoice',
          referenceId: String(invoice._id)
        }
      );
      holdId = String(holdResult.hold._id);
    }
  }

  const saved = await savePaymentReceiptImage(params.file);
  const purgeAt = new Date(Date.now() + settings.receiptRetentionDays * 24 * 60 * 60 * 1000);

  const receipt = await PaymentReceipt.create({
    user: params.userId,
    type: params.type,
    order: params.orderId || undefined,
    invoiceNumber: params.invoiceNumber,
    amount: gatewayAmount,
    imagePath: saved.imagePath,
    imageUrl: saved.imageUrl,
    status: 'PENDING',
    purgeAt
  });

  const resNum = `C2C-${String(receipt._id)}`;
  await FinancePayment.create({
    resNum,
    amount: invoice.total,
    baseAmount: invoice.total - invoice.tax,
    tax: invoice.tax,
    status: 'PENDING',
    userId: params.userId,
    paymentType: params.type,
    invoiceNumber: params.invoiceNumber,
    provider: 'CARD_TO_CARD',
    orderId: params.orderId || undefined,
    walletAmount,
    gatewayAmount,
    holdId,
    activityLog: [
      {
        action: 'receipt_uploaded',
        message: walletAmount > 0
          ? `رسید ثبت شد (پرداخت ترکیبی: کارت به کارت ${gatewayAmount.toLocaleString('fa-IR')} تومان + کسر از کیف پول ${walletAmount.toLocaleString('fa-IR')} تومان)`
          : 'رسید کارت به کارت ثبت شد — در انتظار تأیید'
      }
    ]
  });

  if (params.orderId) {
    await Order.findByIdAndUpdate(params.orderId, {
      paymentMethod: walletAmount > 0 ? 'MIXED' : 'CARD_TO_CARD',
      paymentStatus: 'PENDING'
    });
  }

  return receipt;
}

export async function approvePaymentReceipt(receiptId: string, adminUserId: string, note?: string) {
  await connectToDatabase();
  const receipt = await PaymentReceipt.findById(receiptId);
  if (!receipt) throw new Error('رسید یافت نشد');
  if (receipt.status !== 'PENDING') throw new Error('این رسید قبلاً بررسی شده است');

  receipt.status = 'APPROVED';
  receipt.reviewedBy = adminUserId;
  receipt.reviewedAt = new Date();
  if (note) receipt.adminNote = note;
  await receipt.save();

  const payment = await FinancePayment.findOne({ invoiceNumber: receipt.invoiceNumber, provider: 'CARD_TO_CARD' });
  if (payment) {
    payment.status = 'PAID';
    payment.verifiedAt = new Date();
    payment.activityLog.push({ action: 'receipt_approved', message: 'رسید کارت به کارت تأیید شد', performedAt: new Date() });

    if (payment.holdId) {
      await captureHold(String(payment.holdId), {
        description: `تسویه خرید ترکیبی (فاکتور ${receipt.invoiceNumber})`,
        referenceType: 'invoice'
      });
    }
    await payment.save();
  }

  if (receipt.invoiceNumber) {
    await issueFormalInvoice(receipt.invoiceNumber, payment ? String(payment._id) : undefined);
  }

  if (receipt.type === 'order' && receipt.order) {
    const order = await Order.findById(receipt.order);
    if (order && order.paymentStatus !== 'PAID') {
      const invoice = receipt.invoiceNumber
        ? await Invoice.findOne({ invoiceNumber: receipt.invoiceNumber })
        : null;

      await activateAfterPayment('order', {
        userId: String(receipt.user),
        invoiceNumber: receipt.invoiceNumber || '',
        invoiceId: invoice ? String(invoice._id) : '',
        relatedEntity: { type: 'order', id: String(order._id) }
      });

      order.paymentMethod = payment && payment.walletAmount > 0 ? 'MIXED' : 'CARD_TO_CARD';
      order.paymentStatus = 'PAID';
      await order.save();
      await notifyOrderStatus(String(receipt.user), String(order._id), 'PAID', { amount: order.totalAmount });
    }
  }

  if (receipt.type === 'wallet_topup') {
    await deposit(String(receipt.user), receipt.amount, {
      description: `شارژ کارت به کارت — فاکتور ${receipt.invoiceNumber}`,
      referenceType: 'payment_receipt',
      referenceId: String(receipt._id)
    });
  }

  return receipt;
}

export async function rejectPaymentReceipt(receiptId: string, adminUserId: string, note?: string) {
  await connectToDatabase();
  const receipt = await PaymentReceipt.findById(receiptId);
  if (!receipt) throw new Error('رسید یافت نشد');
  if (receipt.status !== 'PENDING') throw new Error('این رسید قبلاً بررسی شده است');

  receipt.status = 'REJECTED';
  receipt.reviewedBy = adminUserId;
  receipt.reviewedAt = new Date();
  receipt.adminNote = note || 'رد شده توسط پشتیبانی';
  await receipt.save();

  const payment = await FinancePayment.findOne({ invoiceNumber: receipt.invoiceNumber, provider: 'CARD_TO_CARD' });
  if (payment) {
    payment.status = 'FAILED';
    payment.activityLog.push({ action: 'receipt_rejected', message: note || 'رسید رد شد', performedAt: new Date() });

    if (payment.holdId) {
      try {
        await releaseHold(String(payment.holdId));
      } catch {
        // ignore
      }
    }
    await payment.save();
  }

  if (receipt.invoiceNumber) {
    await Invoice.findOneAndUpdate(
      { invoiceNumber: receipt.invoiceNumber },
      { expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) }
    );
  }

  if (receipt.type === 'order' && receipt.order) {
    await Order.findByIdAndUpdate(receipt.order, { paymentStatus: 'FAILED' });
  }

  return receipt;
}

export async function purgeExpiredReceipts() {
  await connectToDatabase();
  const now = new Date();
  const expired = await PaymentReceipt.find({
    purgeAt: { $lte: now },
    status: { $in: ['APPROVED', 'REJECTED'] }
  }).limit(100);

  let deleted = 0;
  for (const r of expired) {
    await deleteReceiptFile(r.imagePath);
    await PaymentReceipt.findByIdAndDelete(r._id);
    deleted++;
  }
  return deleted;
}
