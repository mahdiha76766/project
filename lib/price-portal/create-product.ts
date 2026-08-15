import 'server-only';

import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { syncAllPortalProductsToExcel } from '@/lib/admin/product-excel-full-sync';
import {
  anyProductSkuExists,
  ensureUniqueProductSlug,
  formatNewProductId,
  isDuplicateKeyError,
  nextMongoProductSeq,
  buildBaseProductSlug
} from '@/lib/admin/product-codes';
import { syncProductFieldsFromVariants, type ProductVariant } from '@/lib/product/variants';
import { coercePriceToman } from '@/lib/shop/price-currency';

export type CreatePortalProductInput = {
  name: string;
  variants: Array<{ weight: string; price: number }>;
};

async function resolveFallbackCategoryId() {
  const found = await Category.findOne({ isActive: true }).sort({ createdAt: 1 }).select('_id').lean();
  if (found && !Array.isArray(found)) return String(found._id);

  const created = await Category.create({
    name: 'عمومی',
    slug: `general-${Date.now()}`,
    isActive: true
  });
  return String(created._id);
}

/**
 * محصول را در Mongo می‌سازد، سپس کل اکسل را از پورتال بازنویسی می‌کند.
 */
export async function createPortalProduct(input: CreatePortalProductInput) {
  const name = String(input.name || '').trim();
  let variantsInput = (input.variants || []).map((v) => ({
    weight: String(v.weight || '').trim(),
    price: coercePriceToman(v.price)
  }));

  if (!name) throw new Error('نام محصول الزامی است');
  if (!variantsInput.length) {
    variantsInput = [{ weight: '', price: 0 }];
  }

  await connectToDatabase();
  const preferredSeq = await nextMongoProductSeq();
  let variantSkus = variantsInput.map((_, i) => formatNewProductId(preferredSeq, i + 1));
  if (await anyProductSkuExists(variantSkus)) {
    const freshSeq = await nextMongoProductSeq();
    variantSkus = variantsInput.map((_, i) => formatNewProductId(freshSeq, i + 1));
  }

  const baseSlug = buildBaseProductSlug(name, preferredSeq);
  const slug = await ensureUniqueProductSlug(baseSlug);
  const categoryId = await resolveFallbackCategoryId();

  const variants: ProductVariant[] = variantsInput.map((v, index) => ({
    name: v.weight || (variantsInput.length === 1 ? 'پیش‌فرض' : `وزن ${index + 1}`),
    sku: variantSkus[index],
    price: v.price,
    portalPrice: v.price,
    hasSitePrice: false,
    stock: 0,
    containerSize: v.weight || '',
    isDefault: index === 0
  }));

  const payload = syncProductFieldsFromVariants({
    name,
    slug,
    shortDescription: name,
    fullDescription: '',
    category: categoryId,
    price: variants[0]?.price || 0,
    portalPrice: variants[0]?.price || 0,
    hasSitePrice: false,
    stock: 0,
    sku: variants[0]?.sku,
    containerSize: variants[0]?.containerSize || '',
    attributes: { excelSlug: baseSlug },
    tags: [],
    images: [],
    media: [],
    variants,
    isActive: true,
    isFeatured: false
  });

  let created;
  try {
    created = await Product.create(payload);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const emergencySeq = Math.max(await nextMongoProductSeq(), Date.now() % 100000);
    const emergencySkus = variantsInput.map((_, i) => formatNewProductId(emergencySeq, i + 1));
    const emergencySlug = await ensureUniqueProductSlug(`${slug}-${emergencySeq}`);
    created = await Product.create(
      syncProductFieldsFromVariants({
        ...payload,
        slug: emergencySlug,
        sku: emergencySkus[0],
        variants: variants.map((v, i) => ({ ...v, sku: emergencySkus[i] }))
      })
    );
  }

  const excel = await syncAllPortalProductsToExcel();
  if (!excel.ok) {
    const messages: Record<string, string> = {
      excel_file_missing: 'فایل اکسل products.xlsx یافت نشد',
      site_prices_missing: 'شیت site_prices یافت نشد',
      prices_sheet_missing: 'شیت قیمت یافت نشد',
      site_prices_layout_invalid: 'ساختار شیت site_prices نامعتبر است',
      excel_corrupted: 'فایل اکسل خراب است'
    };
    throw new Error(
      messages[String('reason' in excel ? excel.reason : '')] ||
        'محصول ذخیره شد ولی همگام‌سازی اکسل ناموفق بود.'
    );
  }

  return {
    productId: String(created._id),
    name,
    slug: String(created.slug || slug),
    sourceRow: null as number | null,
    excelVariants: variantsInput.map((v, i) => ({
      productId: variantSkus[i],
      weight: v.weight,
      priceToman: v.price
    })),
    variantsCount: variants.length
  };
}
