import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { getAdminLiveOrders } from '@/lib/admin/dashboard-stats';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const items = await getAdminLiveOrders();
  return NextResponse.json({ items, fetchedAt: new Date().toISOString() });
}
