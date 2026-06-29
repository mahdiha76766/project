import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { getAdminDashboardSummary } from '@/lib/admin/dashboard-stats';
import { parseDashboardRange } from '@/lib/admin/dashboard-range';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const range = parseDashboardRange(new URL(req.url).searchParams.get('range'));
  const summary = await getAdminDashboardSummary(range);
  return NextResponse.json({ summary });
}
