import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/guards';
import { getRealtimeAnalytics } from '@/lib/analytics/stats-service';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const realtime = await getRealtimeAnalytics();
  return NextResponse.json({ realtime });
}
