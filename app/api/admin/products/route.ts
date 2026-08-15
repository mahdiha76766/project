import { NextResponse } from 'next/server';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';
import { normalizeProductUsageType } from '@/constants/product';
import { normalizeVariantsInput, syncProductFieldsFromVariants } from '@/lib/product/variants';
import { normalizeProductMediaInput } from '@/lib/admin/product-media';
import { appendNewProductToExcel } from '@/lib/admin/product-excel-append';
import { syncAllPortalProductsToExcel } from '@/lib/admin/product-excel-full-sync';
import { stockToStatusLabel } from '@/lib/shop/stock-status';
import { coercePriceToman } from '@/lib/shop/price-currency';
import {
  anyProductSkuExists,
  ensureUniqueProductSlug,
  formatNewProductId,
  isDuplicateKeyError,
  nextMongoProductSeq
} from '@/lib/admin/product-codes';

async function guard() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return null;
  return user;
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const filter = mergeMongoFilters(
    buildDocumentSearchFilter(q, ['name', 'slug', 'sku', 'tags', 'variants.sku', 'variants.name'])
  );
  await connectToDatabase();
  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter)
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

    const name = body.name.trim();
    const variants = normalizeVariantsInput(body.variants);
    const { media, images } = normalizeProductMediaInput(body);

    await connectToDatabase();

    let categoryName = '';
    try {
      const cat = await Category.findById(body.category).select('name').lean();
      categoryName = cat && !Array.isArray(cat) ? String(cat.name || '') : '';
    } catch {
      categoryName = '';
    }

    const excelVariants = (variants.length
      ? variants
      : [
          {
            name: body.containerSize || 'پیش‌فرض',
            price: Number(body.price || 0),
            stock: Number(body.stock || 0),
            containerSize: body.containerSize || ''
          }
        ]
    ).map((v) => ({
      weight: String(v.containerSize || v.name || '').trim(),
      priceToman: coercePriceToman(
        typeof (v as { portalPrice?: number }).portalPrice === 'number'
          ? (v as { portalPrice?: number }).portalPrice
          : v.price ?? body.price ?? 0
      )
    }));

    const preferredSeq = await nextMongoProductSeq();
    const excel = await appendNewProductToExcel({
      name,
      variants: excelVariants.length ? excelVariants : [{ weight: '', priceToman: 0 }],
      categoryName,
      stockStatus: stockToStatusLabel(Number(body.stock || 0)),
      preferredSeq
    });

    if (!excel.ok) {
      const messages: Record<string, string> = {
        name_required: 'نام محصول الزامی است',
        variants_required: 'حداقل یک قیمت معتبر لازم است',
        excel_file_missing: 'فایل اکسل products.xlsx یافت نشد',
        site_prices_missing: 'شیت site_prices یافت نشد',
        prices_sheet_missing: 'شیت قیمت یافت نشد',
        site_prices_layout_invalid: 'ساختار شیت site_prices نامعتبر است',
        excel_corrupted: 'فایل اکسل خراب است'
      };
      return NextResponse.json(
        { error: messages[excel.reason] || 'خطا در افزودن محصول به اکسل' },
        { status: 400 }
      );
    }

    let excelSkus = excel.variants.map((v) => v.productId);
    if (await anyProductSkuExists(excelSkus)) {
      const freshSeq = await nextMongoProductSeq();
      excelSkus = excel.variants.map((_, i) => formatNewProductId(freshSeq, i + 1));
    }

    const nextVariants =
      variants.length > 0
        ? variants.map((v, i) => ({
            ...v,
            sku: v.sku || excelSkus[i] || excel.variants[i]?.productId || v.sku,
            portalPrice:
              typeof v.portalPrice === 'number'
                ? v.portalPrice
                : excel.variants[i]?.priceToman ?? Number(v.price || 0),
            containerSize: v.containerSize || excel.variants[i]?.weight || v.containerSize
          }))
        : excel.variants.map((ev, index) => ({
            name: ev.weight || (excel.variants.length === 1 ? 'پیش‌فرض' : `وزن ${index + 1}`),
            sku: excelSkus[index] || ev.productId,
            price: ev.priceToman,
            portalPrice: ev.priceToman,
            stock: index === 0 ? Number(body.stock || 0) : 0,
            containerSize: ev.weight || '',
            isDefault: index === 0
          }));

    const requestedSlug = String(body.slug || body.name || '').trim();
    const slug = await ensureUniqueProductSlug(requestedSlug || excel.baseSlug || name);

    const payload = syncProductFieldsFromVariants({
      name,
      slug,
      shortDescription: body.shortDescription.trim(),
      fullDescription: body.fullDescription || '',
      category: body.category,
      images,
      media,
      price: Number(body.price || excel.variants[0]?.priceToman || 0),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      portalPrice: excel.variants[0]?.priceToman ?? Number(body.price || 0),
      hasSitePrice: false,
      stock: Number(body.stock || 0),
      sku: body.sku?.trim() || excelSkus[0] || excel.variants[0]?.productId,
      unit: body.unit || 'piece',
      weight: body.weight ? Number(body.weight) : undefined,
      weightUnit: body.weightUnit || 'g',
      containerSize: body.containerSize?.trim() || excel.variants[0]?.weight || '',
      usageType: normalizeProductUsageType(body.usageType),
      attributes: {
        ...(body.attributes && typeof body.attributes === 'object' ? body.attributes : {}),
        excelSlug: excel.baseSlug,
        sourceRow: excel.sourceRow
      },
      tags: body.tags || [],
      variants: nextVariants,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false
    });

    try {
      const created = await Product.create(payload);
      await syncAllPortalProductsToExcel();
      const refreshed = await Product.findById(created._id).populate('category', 'name').lean();
      return NextResponse.json({ item: refreshed || created }, { status: 201 });
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
      const emergencySeq = Math.max(await nextMongoProductSeq(), Date.now() % 100000);
      const emergencySkus = excel.variants.map((_, i) => formatNewProductId(emergencySeq, i + 1));
      const emergencySlug = await ensureUniqueProductSlug(`${slug}-${emergencySeq}`);
      const retryPayload = syncProductFieldsFromVariants({
        ...payload,
        slug: emergencySlug,
        sku: body.sku?.trim() || emergencySkus[0],
        variants: nextVariants.map((v, i) => ({
          ...v,
          sku: String(v.sku || '').trim() || emergencySkus[i]
        }))
      });
      const created = await Product.create(retryPayload);
      await syncAllPortalProductsToExcel();
      const refreshed = await Product.findById(created._id).populate('category', 'name').lean();
      return NextResponse.json({ item: refreshed || created }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد محصول' }, { status: 400 });
  }
}
