import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getClientIp, getIdempotencyKey, requireUser } from '@/lib/api/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { payInvoiceSchema } from '@/lib/validation/finance';
import { payInvoice } from '@/lib/finance/payment-orchestrator';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const rate = checkRateLimit(`pay:${auth.user.userId}`, 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });

  await connectToDatabase();
  const body = await req.json();
  const parsed = payInvoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر است' }, { status: 400 });

  try {
    const result = await payInvoice({
      userId: auth.user.userId,
      invoiceNumber: parsed.data.invoiceNumber,
      method: parsed.data.method,
      idempotencyKey: getIdempotencyKey(req),
      mobile: auth.user.mobile,
      ip: getClientIp(req)
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در پرداخت';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
