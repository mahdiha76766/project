import { NextResponse } from 'next/server';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';
import { normalizeProductUsageType } from '@/constants/product';
import { normalizeVariantsInput, syncProductFieldsFromVariants } from '@/lib/product/variants';
import { normalizeProductMediaInput } from '@/lib/admin/product-media';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const variants = normalizeVariantsInput(body.variants);
    const { media, images } = normalizeProductMediaInput(body);
    const payload = syncProductFieldsFromVariants({
      name: body.name?.trim(),
      slug: slugify(body.slug || body.name || ''),
      shortDescription: body.shortDescription?.trim(),
      fullDescription: body.fullDescription || '',
      category: body.category,
      price: Number(body.price || 0),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      stock: Number(body.stock || 0),
      sku: body.sku?.trim() || undefined,
      weight: body.weight ? Number(body.weight) : undefined,
      weightUnit: body.weightUnit || 'g',
      containerSize: body.containerSize?.trim() || '',
      usageType: normalizeProductUsageType(body.usageType),
      attributes: body.attributes || {},
      tags: body.tags || [],
      images,
      media,
      variants,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false
    });

    await connectToDatabase();
    const updated = await Product.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'محصول یافت نشد.' }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ویرایش محصول' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
