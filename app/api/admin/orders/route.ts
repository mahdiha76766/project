import { NextResponse } from 'next/server';
import { Order } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const query: Record<string, unknown> = {};
  if (userId) query.user = userId;

  await connectToDatabase();
  const [items, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name mobile')
      .populate('items.product', 'name images slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
