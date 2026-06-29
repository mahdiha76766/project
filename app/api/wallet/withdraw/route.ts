import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { withdraw } from '@/lib/finance/wallet-service';
import { WithdrawalRequest } from '@/models';
import { walletWithdrawSchema } from '@/lib/validation/finance';
import { notifyWalletTransaction } from '@/lib/finance/notification-service';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const rate = checkRateLimit(`withdraw:${auth.user.userId}`, 3, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });

  await connectToDatabase();
  const body = await req.json();
  const parsed = walletWithdrawSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر است' }, { status: 400 });

  try {
    const { wallet, transaction } = await withdraw(auth.user.userId, parsed.data.amount, {
      description: 'درخواست برداشت'
    });
    const request = await WithdrawalRequest.create({
      user: auth.user.userId,
      amount: parsed.data.amount,
      status: 'PENDING',
      bankInfo: parsed.data.bankInfo ?? {}
    });
    await notifyWalletTransaction(auth.user.userId, 'WITHDRAWAL', parsed.data.amount);
    return NextResponse.json({ wallet, transaction, request });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در برداشت';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
