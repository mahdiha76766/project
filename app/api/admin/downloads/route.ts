import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { DownloadAsset, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireContent } from '@/lib/api/guards';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

const kindSchema = z.enum(['pdf', 'brochure', 'catalog', 'info']);

const createSchema = z.object({
  title: z.string().trim().min(2, 'عنوان الزامی است').max(160),
  description: z.string().trim().max(800).optional().default(''),
  fileUrl: z.string().trim().min(1, 'فایل الزامی است').max(2000),
  fileName: z.string().trim().max(240).optional().default(''),
  fileSize: z.number().min(0).optional().default(0),
  mimeType: z.string().trim().max(120).optional().default('application/pdf'),
  kind: kindSchema.optional().default('pdf'),
  relatedProduct: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional().default(true)
});

function relatedProductValue(raw: string | null | undefined) {
  if (!raw) return null;
  return isValidObjectId(raw) ? raw : null;
}

export async function GET(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const { page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const filter = mergeMongoFilters(buildDocumentSearchFilter(q, ['title', 'description', 'fileName', 'kind']));
  await connectToDatabase();
  const [items, total] = await Promise.all([
    DownloadAsset.find(filter)
      .populate('relatedProduct', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DownloadAsset.countDocuments(filter)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'اطلاعات نامعتبر است.' }, { status: 400 });
  }
  await connectToDatabase();
  const relatedProduct = relatedProductValue(parsed.data.relatedProduct);
  if (relatedProduct) {
    const exists = await Product.exists({ _id: relatedProduct });
    if (!exists) return NextResponse.json({ error: 'محصول مرتبط یافت نشد.' }, { status: 400 });
  }
  const item = await DownloadAsset.create({ ...parsed.data, relatedProduct });
  return NextResponse.json({ item }, { status: 201 });
}
