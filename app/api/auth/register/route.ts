import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { registerSchema } from '@/lib/validation/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rate = checkRateLimit(`register:${ip}`, 10, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = registerSchema.parse(await req.json());
  await connectToDatabase();
  const exists = await User.findOne({ mobile: body.mobile });
  if (exists) return NextResponse.json({ error: 'کاربر قبلا ثبت‌نام کرده است' }, { status: 409 });
  const count = await User.countDocuments();
  const role = count === 0 ? 'ADMIN' : 'CUSTOMER';
  const user = await User.create({ ...body, role });
  return NextResponse.json({ id: user._id, mobile: user.mobile, role: user.role });
}
