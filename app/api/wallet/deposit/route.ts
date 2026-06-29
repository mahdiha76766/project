import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getClientIp, requireUser } from '@/lib/api/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { payInvoice } from '@/lib/finance/payment-orchestrator';
import { createWalletTopupInvoice } from '@/lib/invoice/wallet-invoice';
import { walletDepositSchema } from '@/lib/validation/finance';
import { getCardToCardSettings } from '@/lib/admin/card-to-card-settings';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const rate = checkRateLimit(`deposit:${auth.user.userId}`, 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });

  await connectToDatabase();
  const body = await req.json();
  const parsed = walletDepositSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر است' }, { status: 400 });

  const method = body.method === 'card_to_card' ? 'card_to_card' : 'gateway';

  try {
    const invoice = await createWalletTopupInvoice(
      auth.user.userId,
      parsed.data.amount,
      method === 'card_to_card' ? 7 * 24 * 60 : undefined
    );

    if (method === 'card_to_card') {
      const c2c = await getCardToCardSettings();
      if (!c2c.enabled) return NextResponse.json({ error: 'پرداخت کارت به کارت غیرفعال است' }, { status: 400 });
      return NextResponse.json({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        method: 'card_to_card',
        message: 'فاکتور شارژ ایجاد شد. رسید پرداخت را بارگذاری کنید.'
      });
    }

    const result = await payInvoice({
      userId: auth.user.userId,
      invoiceNumber: invoice.invoiceNumber,
      method: 'gateway',
      idempotencyKey: getIdempotencyKey(req),
      mobile: auth.user.mobile,
      ip: getClientIp(req)
    });
    return NextResponse.json({ invoice, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در شارژ کیف پول';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function getIdempotencyKey(req: Request) {
  return req.headers.get('Idempotency-Key') || `deposit-${Date.now()}`;
}
