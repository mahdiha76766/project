import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { signToken } from '@/lib/auth/token';

export async function POST(req: Request) {
  await connectToDatabase();
  const { mobile, password } = await req.json();
  const user = await User.findOne({ mobile }).select('+password');
  if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ error: 'رمز عبور اشتباه است' }, { status: 401 });
  const token = signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return res;
}
