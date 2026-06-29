import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireAdmin } from '@/lib/api/guards';
import { WalletTransaction } from '@/models';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { userId } = await params;
  await connectToDatabase();

  const { page, limit, skip } = getPaginationParams(req.url);
  const url = new URL(req.url);
  const query: Record<string, unknown> = { user: userId };
  const type = url.searchParams.get('type');
  if (type) query.type = type;

  const [items, total] = await Promise.all([
    WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments(query)
  ]);

  return NextResponse.json(paginatedResponse(items, total, page, limit));
}
