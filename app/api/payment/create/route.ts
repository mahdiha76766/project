import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    provider: body.provider,
    paymentUrl: `/payment/result?status=pending&orderId=${body.orderId}`
  });
}
