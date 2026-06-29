import { NextResponse } from 'next/server';

/** @deprecated Use POST /api/payment/pay or POST /api/invoices/[invoiceNumber]/pay */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(
    {
      error: 'این endpoint منسوخ شده است',
      useInstead: '/api/payment/pay',
      hint: 'ابتدا checkout کنید و سپس invoiceNumber را به /api/payment/pay ارسال کنید',
      received: body
    },
    { status: 410 }
  );
}
