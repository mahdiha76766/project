import { NextResponse } from 'next/server';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { updateDocByAnyId, findDocByAnyId, deleteDocByAnyId } from '@/lib/db/find-by-any-id';
import { syncProductPricesToExcel } from '@/lib/price-portal/products';
import { deleteProductFromExcel } from '@/lib/admin/product-excel-delete';
import { requireCatalog } from '@/lib/api/guards';
import { slugify } from '@/lib/utils/slugify';
import { normalizeProductUsageType, normalizeProductLine } from '@/constants/product';
import { normalizeVariantsInput, syncProductFieldsFromVariants } from '@/lib/product/variants';
import { normalizeProductMediaInput } from '@/lib/admin/product-media';

async function guard() {
  const auth = await requireCatalog();
  return Boolean(auth.user);
}

async function resolveCategoryName(categoryId: unknown): Promise<string | null> {
  const id = String(categoryId || '').trim();
  if (!id) return null;
  const found = await Category.findById(id).select('name').lean();
  if (!found || Array.isArray(found)) return null;
  return String(found.name || '').trim() || null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const existing = await findDocByAnyId(Product, id);
    if (!existing) return NextResponse.json({ error: 'محصول یافت نشد.' }, { status: 404 });

    const existingVariants = Array.isArray(existing.variants) ? existing.variants : [];
    let variants = normalizeVariantsInput(body.variants);
    if (variants.length) {
      variants = variants.map((v, index) => {
        const prev =
          (v._id && existingVariants.find((ev: { _id?: unknown }) => String(ev._id) === String(v._id))) ||
          existingVariants[index];
        if (!prev) return v;
        return {
          ...v,
          portalPrice:
            typeof v.portalPrice === 'number'
              ? v.portalPrice
              : typeof prev.portalPrice === 'number'
                ? prev.portalPrice
                : undefined,
          hasSitePrice:
            typeof v.hasSitePrice === 'boolean'
              ? v.hasSitePrice
              : typeof prev.hasSitePrice === 'boolean'
                ? prev.hasSitePrice
                : undefined,
          sitePercent:
            typeof v.sitePercent === 'number'
              ? v.sitePercent
              : typeof prev.sitePercent === 'number'
                ? prev.sitePercent
                : undefined
        };
      });
    }

    const { media, images } = normalizeProductMediaInput(body);
    const nextSlug = slugify(body.slug || body.name || '');
    const payload = syncProductFieldsFromVariants({
      name: body.name?.trim(),
      slug: nextSlug,
      shortDescription: body.shortDescription?.trim(),
      fullDescription: body.fullDescription || '',
      category: body.category,
      price: Number(body.price || 0),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      portalPrice: existing.portalPrice,
      hasSitePrice: existing.hasSitePrice,
      sitePercent: existing.sitePercent,
      stock: Number(body.stock || 0),
      sku: body.sku?.trim() || undefined,
      weight: body.weight ? Number(body.weight) : undefined,
      weightUnit: body.weightUnit || 'g',
      containerSize: body.containerSize?.trim() || '',
      usageType: normalizeProductUsageType(body.usageType),
      productLine: normalizeProductLine(body.productLine),
      attributes: {
        ...(existing.attributes && typeof existing.attributes === 'object' ? existing.attributes : {}),
        ...(body.attributes && typeof body.attributes === 'object' ? body.attributes : {}),
        excelSlug: nextSlug.replace(/-/g, '_')
      },
      tags: body.tags || [],
      images,
      media,
      variants,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      seo: {
        title: String(body.seo?.title || body.seoTitle || '').trim(),
        description: String(body.seo?.description || body.seoDescription || '').trim()
      }
    });

    const updated = await updateDocByAnyId(Product, id, payload, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: 'محصول یافت نشد.' }, { status: 404 });

    const categoryName = await resolveCategoryName(updated.category ?? body.category);

    // همیشه اکسل را با متادیتا همگام کن (اسلاگ / نام / وزن / قیمت / دسته / وضعیت)
    await syncProductPricesToExcel(id, {
      previous: {
        name: String(existing.name || ''),
        slug: String(existing.slug || ''),
        variants: existingVariants
      },
      categoryName
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ویرایش محصول' }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  const existing = await findDocByAnyId(Product, id);
  if (!existing) return NextResponse.json({ error: 'محصول یافت نشد.' }, { status: 404 });

  const productName = String(existing.name || '').trim();
  const productSlug = String(existing.slug || '').trim();
  const attrs =
    existing.attributes && typeof existing.attributes === 'object'
      ? (existing.attributes as { excelSlug?: string; sourceRow?: number })
      : {};
  const excelSlug = String(attrs.excelSlug || productSlug).trim();
  const sourceRow = Number(attrs.sourceRow || 0) || null;
  const variantSkus = [
    String(existing.sku || '').trim(),
    ...(Array.isArray(existing.variants)
      ? existing.variants.map((v: { sku?: string }) => String(v.sku || '').trim())
      : [])
  ].filter(Boolean);

  try {
    const excel = await deleteProductFromExcel({
      productName,
      productSlug,
      excelSlug,
      sourceRow,
      variantSkus
    });
    if (!excel.ok && excel.reason !== 'excel_file_missing') {
      console.error('[admin][products] excel delete failed', excel);
    }
  } catch (excelError) {
    console.error('[admin][products] excel delete error', excelError);
  }

  await deleteDocByAnyId(Product, id);
  return NextResponse.json({ ok: true });
}
