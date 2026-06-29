import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { getFinanceSummary } from '@/lib/finance/stats-service';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const summary = await getFinanceSummary();
  return NextResponse.json({ summary });
}
