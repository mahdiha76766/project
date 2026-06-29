import { FinancePayment } from '@/models';

export async function findExistingPaymentByKey(idempotencyKey?: string) {
  if (!idempotencyKey) return null;
  return FinancePayment.findOne({ idempotencyKey });
}

export async function findPaymentByResNum(resNum: string) {
  return FinancePayment.findOne({ resNum });
}

export function isPaymentAlreadyProcessed(status: string) {
  return status === 'PAID' || status === 'REFUNDED';
}

export type CachedPaymentResult = {
  alreadyProcessed: boolean;
  payment: Awaited<ReturnType<typeof findPaymentByResNum>>;
};

export async function checkPaymentIdempotency(resNum: string): Promise<CachedPaymentResult> {
  const payment = await findPaymentByResNum(resNum);
  if (!payment) return { alreadyProcessed: false, payment: null };
  return { alreadyProcessed: isPaymentAlreadyProcessed(payment.status), payment };
}
