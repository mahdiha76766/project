import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { FinancePayment } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const q = getListSearchQuery(req.url);
  const query = mergeMongoFilters(
    status ? { status } : {},
    buildDocumentSearchFilter(q, ['authority', 'refNum', 'resNum', 'status', 'invoiceNumber'])
  );

  const [items, total] = await Promise.all([
    FinancePayment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'name mobile').lean(),
    FinancePayment.countDocuments(query)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
