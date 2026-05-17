import { NextResponse } from 'next/server';
import { Order } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

async function guard() { const user = await getSessionUser(); return user && hasMinimumRole(user.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const items = await Order.find().populate('user', 'name mobile').populate('items.product', 'name').sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ items });
}
