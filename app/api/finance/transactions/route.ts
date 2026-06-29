import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { WalletTransaction } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();

  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const query: Record<string, unknown> = {};
  const type = url.searchParams.get('type');
  const userId = url.searchParams.get('userId');
  const search = url.searchParams.get('search');
  if (type) query.type = type;
  if (userId) query.user = userId;
  if (search) query.transactionId = { $regex: search, $options: 'i' };

  const [items, total] = await Promise.all([
    WalletTransaction.find(query).populate('user', 'name mobile').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments(query)
  ]);

  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
