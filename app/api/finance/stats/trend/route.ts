import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { getFinanceTrend } from '@/lib/finance/stats-service';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const url = new URL(req.url);
  const period = url.searchParams.get('period') === 'monthly' ? 'monthly' : 'daily';
  const days = Number(url.searchParams.get('days') ?? 30);
  const trend = await getFinanceTrend(period, days);
  return NextResponse.json({ trend });
}
