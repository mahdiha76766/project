import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/guards';
import { getAnalyticsSummary, type AnalyticsRangeDays } from '@/lib/analytics/stats-service';

export async function GET(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const range = Number(new URL(req.url).searchParams.get('range') || 7);
  const allowed: AnalyticsRangeDays[] = [7, 14, 30, 90];
  const rangeDays = (allowed.includes(range as AnalyticsRangeDays) ? range : 7) as AnalyticsRangeDays;
  const summary = await getAnalyticsSummary(rangeDays);
  return NextResponse.json({ summary });
}
