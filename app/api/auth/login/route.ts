import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { signToken } from '@/lib/auth/token';
import { loginSchema } from '@/lib/validation/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rate = checkRateLimit(`login:${ip}`, 5, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'تعداد تلاش زیاد است، کمی بعد تلاش کنید' }, { status: 429 });

  const { mobile, password } = loginSchema.parse(await req.json());
  await connectToDatabase();
  const user = await User.findOne({ mobile }).select('+password');
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: 'رمز عبور اشتباه است' }, { status: 401 });
  const token = signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/' });
  return res;
}
