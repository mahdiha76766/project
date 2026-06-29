import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getIdempotencyKey, requireUser } from '@/lib/api/guards';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { transfer } from '@/lib/finance/wallet-service';
import { User } from '@/models';
import { walletTransferSchema } from '@/lib/validation/finance';
import { notifyWalletTransaction } from '@/lib/finance/notification-service';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const rate = checkRateLimit(`transfer:${auth.user.userId}`, 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });

  await connectToDatabase();
  const body = await req.json();
  const parsed = walletTransferSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'ورودی نامعتبر است' }, { status: 400 });

  const toUser = await User.findOne({ mobile: parsed.data.toMobile });
  if (!toUser) return NextResponse.json({ error: 'کاربر مقصد یافت نشد' }, { status: 404 });

  try {
    const result = await transfer(
      auth.user.userId,
      String(toUser._id),
      parsed.data.amount,
      { description: parsed.data.description, idempotencyKey: getIdempotencyKey(req) }
    );
    await notifyWalletTransaction(auth.user.userId, 'TRANSFER_OUT', parsed.data.amount);
    await notifyWalletTransaction(String(toUser._id), 'TRANSFER_IN', parsed.data.amount);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در انتقال';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
