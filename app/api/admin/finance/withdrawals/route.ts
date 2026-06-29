import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { WithdrawalRequest } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const query: Record<string, unknown> = {};
  const status = url.searchParams.get('status');
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    WithdrawalRequest.find(query).populate('user', 'name mobile').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WithdrawalRequest.countDocuments(query)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
