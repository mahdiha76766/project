import type { ClientSession } from 'mongoose';
import { Invoice } from '@/models';

/** تولید شماره فاکتور ۶ رقمی تصادفی و یکتا */
export async function generateRandomInvoiceNumber(session?: ClientSession, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const exists = await Invoice.findOne({ invoiceNumber: candidate }).session(session ?? null).select('_id').lean();
    if (!exists) return candidate;
  }
  throw new Error('امکان تولید شماره فاکتور یکتا وجود ندارد. دوباره تلاش کنید.');
}
