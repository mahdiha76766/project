import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { expireStalePayments } from '@/lib/finance/expire-service';
import { purgeExpiredReceipts } from '@/lib/payment/receipt-service';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectToDatabase();
  const result = await expireStalePayments();
  const purgedReceipts = await purgeExpiredReceipts();
  return NextResponse.json({ ...result, purgedReceipts });
}

export async function GET(req: Request) {
  return POST(req);
}
