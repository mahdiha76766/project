import { NextResponse } from 'next/server';
import { env } from '@/server/config/env';

/** @deprecated Use GET/POST /api/payment/verify */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const resNum = body.resNum ?? body.ResNum;
  if (resNum) {
    return NextResponse.redirect(
      new URL(`/api/payment/verify?ResNum=${encodeURIComponent(resNum)}&State=${body.success ? 'OK' : 'FAILED'}`, env.APP_BASE_URL)
    );
  }
  return NextResponse.json({ error: 'از /api/payment/verify استفاده کنید' }, { status: 410 });
}
