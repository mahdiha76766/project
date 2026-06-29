import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { env } from '@/server/config/env';
import { getClientIp } from '@/lib/api/guards';
import { verifyPaymentFromCallback } from '@/lib/finance/payment-orchestrator';

async function handleVerify(req: Request) {
  await connectToDatabase();
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      Object.assign(query, body);
    } catch {
      // ignore empty body
    }
  }

  try {
    const result = await verifyPaymentFromCallback(query, getClientIp(req));
    const redirect = result.redirectUrl ?? `/payment/result?status=${result.success ? 'paid' : 'failed'}`;
    return NextResponse.redirect(new URL(redirect, env.APP_BASE_URL));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در تأیید پرداخت';
    return NextResponse.redirect(new URL(`/payment/result?status=failed&message=${encodeURIComponent(message)}`, env.APP_BASE_URL));
  }
}

export async function GET(req: Request) {
  return handleVerify(req);
}

export async function POST(req: Request) {
  return handleVerify(req);
}
