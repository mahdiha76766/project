import mongoose, { type ClientSession } from 'mongoose';
import { Invoice, PaymentReceipt } from '@/models';
import { generateRandomInvoiceNumber } from '@/lib/invoice/invoice-number';
import { env } from '@/server/config/env';
import type { InvoiceType } from '@/constants/invoice';
import { runInTransaction } from '@/lib/db/transaction';

type InvoiceItemInput = {
  title: string;
  description?: string;
  quantity?: number;
  unitPrice: number;
  metadata?: Record<string, unknown>;
};

type RelatedEntity = {
  type: string;
  id: string;
};

type BuyerInfo = {
  name?: string;
  mobile?: string;
  email?: string;
  nationalId?: string;
  address?: string;
};

function computeTotals(items: InvoiceItemInput[], taxRate = env.PAYMENT_TAX_RATE, discountAmount = 0) {
  const normalized = items.map((item) => {
    const quantity = item.quantity ?? 1;
    const totalPrice = quantity * item.unitPrice;
    return { ...item, quantity, totalPrice };
  });
  const gross = normalized.reduce((sum, item) => sum + item.totalPrice, 0);
  const subtotal = Math.max(gross - discountAmount, 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  return { items: normalized, subtotal, tax, total, discountAmount };
}

export async function createProforma(params: {
  userId: string;
  type: InvoiceType;
  items: InvoiceItemInput[];
  relatedEntity?: RelatedEntity;
  buyerInfo?: BuyerInfo;
  notes?: string;
  expiresInMinutes?: number;
  discountAmount?: number;
}) {
  return runInTransaction(async (session) => {
    const invoiceNumber = await generateRandomInvoiceNumber(session);
    const proformaNumber = invoiceNumber;
    const { items, subtotal, tax, total } = computeTotals(params.items, env.PAYMENT_TAX_RATE, params.discountAmount ?? 0);
    const expiresAt = new Date(Date.now() + (params.expiresInMinutes ?? env.ORDER_PAYMENT_TIMEOUT_MINUTES) * 60_000);
    const [created] = await Invoice.create(
      [
        {
          invoiceNumber,
          proformaNumber,
          user: params.userId,
          type: params.type,
          status: 'pending',
          items,
          subtotal,
          tax,
          total,
          relatedEntity: params.relatedEntity,
          buyerInfo: params.buyerInfo ?? {},
          notes: params.notes ?? '',
          expiresAt
        }
      ],
      session ? { session } : undefined
    );
    return created as InstanceType<typeof Invoice>;
  });
}

export async function issueFormalInvoice(invoiceNumber: string, paymentId?: string, session?: ClientSession) {
  const invoice = await Invoice.findOne({ invoiceNumber }).session(session ?? null);
  if (!invoice) throw new Error('فاکتور یافت نشد');
  if (invoice.status === 'paid' && invoice.formalNumber) return invoice;
  invoice.formalNumber = invoice.formalNumber ?? invoice.invoiceNumber;
  invoice.status = 'paid';
  invoice.paidAt = new Date();
  if (paymentId) invoice.paymentId = paymentId;
  await invoice.save({ session });
  return invoice;
}

export async function previewInvoice(invoiceNumber: string, userId: string) {
  const invoice = await Invoice.findOne({ invoiceNumber, user: userId }).lean();
  if (!invoice) throw new Error('فاکتور یافت نشد');
  return invoice;
}

export async function getInvoiceByNumber(invoiceNumber: string) {
  const invoice = await Invoice.findOne({ invoiceNumber });
  if (!invoice) throw new Error('فاکتور یافت نشد');
  return invoice;
}

export async function cancelInvoice(invoiceNumber: string, session?: ClientSession) {
  const invoice = await Invoice.findOne({ invoiceNumber }).session(session ?? null);
  if (!invoice) throw new Error('فاکتور یافت نشد');
  if (invoice.status === 'paid') throw new Error('فاکتور پرداخت‌شده قابل لغو نیست');
  invoice.status = 'cancelled';
  await invoice.save({ session });
  return invoice;
}

export async function listUserInvoices(userId: string, filters?: { status?: string; type?: string }) {
  const query: Record<string, unknown> = { user: userId };
  if (filters?.status) query.status = filters.status;
  if (filters?.type) query.type = filters.type;
  const invoices = await Invoice.find(query).sort({ createdAt: -1 }).lean();
  const numbers = invoices.map((i) => i.invoiceNumber).filter(Boolean);
  if (!numbers.length) return invoices;

  const receipts = await PaymentReceipt.find({ user: userId, invoiceNumber: { $in: numbers } })
    .sort({ createdAt: -1 })
    .lean();

  return invoices.map((inv) => {
    const invoiceReceipts = receipts.filter((r) => r.invoiceNumber === inv.invoiceNumber);
    const activeReceipt = invoiceReceipts.find((r) => r.status !== 'REJECTED') || invoiceReceipts[0];
    const rejectCount = invoiceReceipts.filter((r) => r.status === 'REJECTED').length;

    return {
      ...inv,
      paymentMethod: activeReceipt ? 'CARD_TO_CARD' : undefined,
      receiptStatus: activeReceipt?.status || null,
      receiptId: activeReceipt ? String(activeReceipt._id) : null,
      receiptImageUrl: activeReceipt?.imageUrl || null,
      receiptRejectCount: rejectCount
    };
  });
}
