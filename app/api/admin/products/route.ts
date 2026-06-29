import { NextResponse } from 'next/server';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { normalizeProductUsageType } from '@/constants/product';
import { normalizeVariantsInput, syncProductFieldsFromVariants } from '@/lib/product/variants';
import { normalizeProductMediaInput } from '@/lib/admin/product-media';

async function guard() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return null;
  return user;
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  await connectToDatabase();
  const [items, total] = await Promise.all([
    Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments()
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'نام محصول الزامی است.' }, { status: 400 });
    if (!body.category) return NextResponse.json({ error: 'دسته‌بندی الزامی است.' }, { status: 400 });
    if (!body.shortDescription?.trim()) return NextResponse.json({ error: 'توضیح کوتاه الزامی است.' }, { status: 400 });

    const variants = normalizeVariantsInput(body.variants);
    const { media, images } = normalizeProductMediaInput(body);
    const payload = syncProductFieldsFromVariants({
      name: body.name.trim(),
      slug: slugify(body.slug || body.name),
      shortDescription: body.shortDescription.trim(),
      fullDescription: body.fullDescription || '',
      category: body.category,
      images,
      media,
      price: Number(body.price || 0),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      stock: Number(body.stock || 0),
      sku: body.sku?.trim() || undefined,
      unit: body.unit || 'piece',
      weight: body.weight ? Number(body.weight) : undefined,
      weightUnit: body.weightUnit || 'g',
      containerSize: body.containerSize?.trim() || '',
      usageType: normalizeProductUsageType(body.usageType),
      attributes: body.attributes || {},
      tags: body.tags || [],
      variants,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false
    });

    await connectToDatabase();
    const created = await Product.create(payload);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد محصول' }, { status: 400 });
  }
}
