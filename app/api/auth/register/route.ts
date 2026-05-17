import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { registerSchema } from '@/lib/validation/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

const normalizeMobile = (value: string) =>
  value
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s|-/g, '');

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rate = checkRateLimit(`register:${ip}`, 10, 60_000);
    if (!rate.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const raw = await req.json();
    const body = registerSchema.parse({ ...raw, mobile: normalizeMobile(String(raw.mobile || '')) });

    await connectToDatabase();
    const exists = await User.findOne({ mobile: body.mobile });
    if (exists) return NextResponse.json({ error: 'کاربر قبلا ثبت‌نام کرده است' }, { status: 409 });
    const count = await User.countDocuments();
    const role = count === 0 ? 'ADMIN' : 'CUSTOMER';
    const user = await User.create({ ...body, role });
    return NextResponse.json({ id: user._id, mobile: user.mobile, role: user.role });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'شماره موبایل یا اطلاعات واردشده صحیح نیست.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'خطا در ارتباط با سرور/دیتابیس. دوباره تلاش کنید.' }, { status: 503 });
  }
}
