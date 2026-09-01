import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireCatalog } from '@/lib/api/guards';
import { slugify } from '@/lib/utils/slugify';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

async function guard() {
  const auth = await requireCatalog();
  return Boolean(auth.user);
}

const normalizeImage = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image;
  return `/${image}`;
};

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { all, page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const filter = mergeMongoFilters(buildDocumentSearchFilter(q, ['name', 'slug', 'description']));
  await connectToDatabase();

  if (all) {
    const items = await Category.find(filter).populate('parent', 'name').sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json({ items });
  }

  const [items, total] = await Promise.all([
    Category.find(filter).populate('parent', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments(filter)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'نام دسته‌بندی الزامی است.' }, { status: 400 });
    await connectToDatabase();
    const item = await Category.create({
      name: body.name.trim(),
      slug: slugify(body.slug || body.name),
      description: body.description || '',
      image: normalizeImage(body.image),
      parent: body.parent || null,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      seoTitle: String(body.seoTitle || '').trim(),
      seoDescription: String(body.seoDescription || '').trim(),
      isActive: body.isActive ?? true
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد دسته‌بندی' }, { status: 400 });
  }
}
