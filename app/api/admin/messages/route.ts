import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ContactInquiry } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireContent } from '@/lib/api/guards';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

const statusSchema = z.enum(['NEW', 'READ']);

export async function GET(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;

  const { page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const status = new URL(req.url).searchParams.get('status');
  const statusFilter = status === 'NEW' || status === 'READ' ? { status } : {};
  const filter = mergeMongoFilters(
    statusFilter,
    buildDocumentSearchFilter(q, ['name', 'email', 'phone', 'subject', 'message'])
  );

  await connectToDatabase();
  const [items, total] = await Promise.all([
    ContactInquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactInquiry.countDocuments(filter)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function PUT(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ ids: z.array(z.string()).min(1), status: statusSchema }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
  await connectToDatabase();
  await ContactInquiry.updateMany({ _id: { $in: parsed.data.ids } }, { status: parsed.data.status });
  return NextResponse.json({ ok: true });
}
