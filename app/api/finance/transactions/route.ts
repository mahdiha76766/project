import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { WalletTransaction } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();

  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const userId = url.searchParams.get('userId');
  const q = getListSearchQuery(req.url) || url.searchParams.get('search')?.trim() || '';
  const query = mergeMongoFilters(
    type ? { type } : {},
    userId ? { user: userId } : {},
    buildDocumentSearchFilter(q, ['transactionId', 'description', 'type', 'status'])
  );

  const [items, total] = await Promise.all([
    WalletTransaction.find(query).populate('user', 'name mobile').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments(query)
  ]);

  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
