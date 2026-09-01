import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ContactInquiry } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/api/guards';

const schema = z.object({
  name: z.string().trim().min(2, 'نام را وارد کنید').max(80),
  email: z.string().trim().email('ایمیل معتبر نیست').max(120),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'پیام کوتاه است').max(2000)
});

export async function POST(req: Request) {
  const ip = getClientIp(req) || 'unknown';
  const rate = checkRateLimit(`contact:${ip}`, 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'تعداد درخواست زیاد است، کمی بعد تلاش کنید.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'اطلاعات نامعتبر است.' }, { status: 400 });
    }
    await connectToDatabase();
    await ContactInquiry.create(parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'ارسال پیام انجام نشد.' }, { status: 500 });
  }
}
