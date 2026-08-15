import 'server-only';

import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  PRODUCTS_EXCEL_SHEET,
  normalizeProductText,
  resolveProductsExcelPath
} from '@/lib/admin/product-excel-import';
import {
  appendNewProductToExcel,
  LEGACY_PRICES_SHEET
} from '@/lib/admin/product-excel-append';
import {
  readProductsExcelWorkbook,
  withProductsExcelLock
} from '@/lib/admin/product-excel-io';
import { PRODUCT_WEIGHT_UNIT_LABELS } from '@/lib/product/specs';
import { getProductVariants } from '@/lib/product/variants';
import { updateDocByAnyId } from '@/lib/db/find-by-any-id';
import { coercePriceToman } from '@/lib/shop/price-currency';
import { stockToStatusLabel } from '@/lib/shop/stock-status';

function cellPlainValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('result' in value && value.result != null) return value.result;
    if ('text' in value && value.text != null) return value.text;
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((p) => p.text).join('');
    }
  }
  return value;
}

function buildColMap(row: ExcelJS.Row) {
  const colMap: Record<string, number> = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const label = String(cellPlainValue(cell.value) ?? '').trim();
    if (label) colMap[label] = colNumber;
  });
  return colMap;
}

function parseSitePricesLayout(sheet: ExcelJS.Worksheet) {
  const maxScan = Math.min(6, sheet.rowCount || 6);
  for (let r = 1; r <= maxScan; r++) {
    const colMap = buildColMap(sheet.getRow(r));
    if (colMap.price_toman != null || colMap['نام محصول'] != null) {
      return { headerRow: r, colMap };
    }
  }
  return null;
}

function formatVariantWeight(v: {
  name?: string;
  containerSize?: string;
  weight?: number;
  weightUnit?: string;
}) {
  if (v.containerSize) return String(v.containerSize).trim();
  if (v.weight != null && v.weightUnit) {
    const unit = PRODUCT_WEIGHT_UNIT_LABELS[v.weightUnit] || v.weightUnit;
    return `${v.weight} ${unit}`.trim();
  }
  const name = String(v.name || '').trim();
  return name && name !== 'پیش‌فرض' ? name : '';
}

export type ExcelProductPresence = {
  found: boolean;
  sourceRow: number | null;
  matchedNames: string[];
  matchedSlugs: string[];
};

/**
 * آیا محصولی با این نام/اسلاگ/sku در site_prices هست؟
 */
export async function findProductInExcel(input: {
  name?: string;
  slug?: string;
  excelSlug?: string;
  skus?: string[];
  filePath?: string;
}): Promise<ExcelProductPresence> {
  const filePath = input.filePath || resolveProductsExcelPath();
  const empty: ExcelProductPresence = {
    found: false,
    sourceRow: null,
    matchedNames: [],
    matchedSlugs: []
  };

  try {
    await fs.access(filePath);
  } catch {
    return empty;
  }

  return withProductsExcelLock(async () => {
    const workbook = await readProductsExcelWorkbook(filePath);
    const siteSheet = workbook.getWorksheet(PRODUCTS_EXCEL_SHEET);
    if (!siteSheet) return empty;

    const layout = parseSitePricesLayout(siteSheet);
    if (!layout) return empty;

    const nameNorm = normalizeProductText(String(input.name || ''));
    const slugNorms = [input.slug, input.excelSlug]
      .map((s) => normalizeProductText(String(s || '').replace(/-/g, '_')))
      .filter(Boolean);
    const skuNorms = new Set(
      (input.skus || []).map((s) => normalizeProductText(String(s || ''))).filter(Boolean)
    );

    const nameCol = layout.colMap['نام محصول'];
    const slugCol = layout.colMap.slug;
    const idCol = layout.colMap.product_id ?? layout.colMap.site_key;
    const sourceCol = layout.colMap.source_row;

    let sourceRow: number | null = null;
    const matchedNames: string[] = [];
    const matchedSlugs: string[] = [];

    siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;
      if (sourceRow != null) return;

      const name = nameCol
        ? String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim()
        : '';
      const slug = slugCol
        ? String(cellPlainValue(excelRow.getCell(slugCol).value) ?? '').trim()
        : '';
      const productId = idCol
        ? String(cellPlainValue(excelRow.getCell(idCol).value) ?? '').trim()
        : '';

      const byName = Boolean(nameNorm && normalizeProductText(name) === nameNorm);
      const bySlug =
        Boolean(slug) &&
        slugNorms.some((s) => {
          const rowSlug = normalizeProductText(slug.replace(/-/g, '_'));
          return rowSlug === s || rowSlug.startsWith(`${s}_`) || s.startsWith(rowSlug);
        });
      const bySku = Boolean(productId && skuNorms.has(normalizeProductText(productId)));

      if (!(byName || bySlug || bySku)) return;

      sourceRow = sourceCol
        ? Number(cellPlainValue(excelRow.getCell(sourceCol).value)) || rowNumber
        : rowNumber;
      if (name) matchedNames.push(name);
      if (slug) matchedSlugs.push(slug);
    });

    return {
      found: sourceRow != null,
      sourceRow,
      matchedNames,
      matchedSlugs
    };
  });
}

type MongoProductLike = {
  _id?: unknown;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  portalPrice?: number;
  stock?: number;
  category?: unknown;
  attributes?: { excelSlug?: string; sourceRow?: number };
  variants?: Array<{
    name?: string;
    sku?: string;
    price?: number;
    portalPrice?: number;
    stock?: number;
    containerSize?: string;
    weight?: number;
    weightUnit?: string;
    isDefault?: boolean;
  }>;
};

function buildAppendVariantsFromMongo(product: MongoProductLike) {
  const variants = getProductVariants(product as never);
  const rows = variants.map((v) => {
    const portal =
      typeof (v as { portalPrice?: number }).portalPrice === 'number'
        ? (v as { portalPrice?: number }).portalPrice
        : null;
    const priceToman = coercePriceToman(
      portal ?? v.price ?? product.portalPrice ?? product.price ?? 0
    );
    return {
      weight: formatVariantWeight(v),
      priceToman
    };
  });

  // append حداقل یک واریانت می‌خواهد؛ قیمت صفر هم مجاز است تا محصول در اکسل ساخته شود
  if (!rows.length) {
    return [{ weight: '', priceToman: coercePriceToman(product.portalPrice ?? product.price ?? 0) }];
  }
  return rows;
}

/**
 * اگر محصول در اکسل نبود، به site_prices + شیت «قیمت» اضافه می‌کند
 * و attributes.sourceRow / excelSlug را در Mongo به‌روز می‌کند.
 */
export async function ensureMongoProductInExcel(
  product: MongoProductLike,
  options?: { categoryName?: string | null; filePath?: string }
) {
  const name = String(product.name || '').trim();
  if (!name) {
    return { ok: false as const, reason: 'name_required' as const, created: false };
  }

  const slug = String(product.slug || '');
  const excelSlug = String(product.attributes?.excelSlug || slug);
  const variants = getProductVariants(product as never);
  const skus = [
    String(product.sku || ''),
    ...variants.map((v) => String(v.sku || ''))
  ].filter(Boolean);

  const presence = await findProductInExcel({
    name,
    slug,
    excelSlug,
    skus,
    filePath: options?.filePath
  });

  if (presence.found) {
    // اگر sourceRow در Mongo نیست، پر کن
    if (presence.sourceRow && product._id && !product.attributes?.sourceRow) {
      await connectToDatabase();
      await updateDocByAnyId(Product as never, String(product._id), {
        'attributes.sourceRow': presence.sourceRow,
        'attributes.excelSlug': excelSlug || slug
      });
    }
    return {
      ok: true as const,
      created: false,
      sourceRow: presence.sourceRow,
      reason: 'already_exists' as const
    };
  }

  const appendVariants = buildAppendVariantsFromMongo(product);
  const stockStatus = stockToStatusLabel(
    variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) || product.stock
  );

  const { nextMongoProductSeq } = await import('@/lib/admin/product-codes');
  const preferredSeq = await nextMongoProductSeq();

  const excel = await appendNewProductToExcel(
    {
      name,
      variants: appendVariants,
      categoryName: options?.categoryName || '',
      stockStatus,
      preferredSeq
    },
    options?.filePath
  );

  if (!excel.ok) {
    return {
      ok: false as const,
      created: false,
      reason: excel.reason,
      filePath: 'filePath' in excel ? excel.filePath : undefined
    };
  }

  if (product._id) {
    await connectToDatabase();
    const nextVariants = variants.map((v, i) => ({
      ...v,
      // فقط sku خالی را پر کن تا با ایندکس یکتا تداخل نکند
      sku: String(v.sku || '').trim() || excel.variants[i]?.productId || v.sku
    }));

    try {
      await updateDocByAnyId(Product as never, String(product._id), {
        'attributes.sourceRow': excel.sourceRow,
        'attributes.excelSlug': excel.baseSlug,
        variants: nextVariants,
        ...(String(product.sku || '').trim()
          ? {}
          : { sku: excel.variants[0]?.productId || product.sku })
      });
    } catch (error) {
      // اکسل ساخته شده؛ فقط attributes را ذخیره کن
      console.warn('[excel][ensure] mongo sku update failed; saving attributes only', {
        name,
        error: error instanceof Error ? error.message : error
      });
      await updateDocByAnyId(Product as never, String(product._id), {
        'attributes.sourceRow': excel.sourceRow,
        'attributes.excelSlug': excel.baseSlug
      });
    }
  }

  return {
    ok: true as const,
    created: true,
    sourceRow: excel.sourceRow,
    baseSlug: excel.baseSlug,
    variants: excel.variants
  };
}

/**
 * همهٔ محصولات Mongo که در اکسل نیستند را اضافه می‌کند.
 */
export async function reconcileMissingProductsToExcel(filePath = resolveProductsExcelPath()) {
  await connectToDatabase();

  // سریع: مجموعه نام/اسلاگ/sku موجود در اکسل
  const excelIndex = await withProductsExcelLock(async () => {
    const workbook = await readProductsExcelWorkbook(filePath);
    const siteSheet = workbook.getWorksheet(PRODUCTS_EXCEL_SHEET);
    if (!siteSheet) throw new Error('site_prices missing');
    const layout = parseSitePricesLayout(siteSheet);
    if (!layout) throw new Error('site_prices layout invalid');

    const names = new Set<string>();
    const slugs = new Set<string>();
    const skus = new Set<string>();
    const nameCol = layout.colMap['نام محصول'];
    const slugCol = layout.colMap.slug;
    const idCol = layout.colMap.product_id ?? layout.colMap.site_key;

    siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;
      const name = nameCol
        ? String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim()
        : '';
      const slug = slugCol
        ? String(cellPlainValue(excelRow.getCell(slugCol).value) ?? '').trim()
        : '';
      const productId = idCol
        ? String(cellPlainValue(excelRow.getCell(idCol).value) ?? '').trim()
        : '';
      if (name) names.add(normalizeProductText(name));
      if (slug) slugs.add(normalizeProductText(slug.replace(/-/g, '_')));
      if (productId) skus.add(normalizeProductText(productId));
    });

    // وجود شیت قیمت را هم چک کن
    const priceSheet =
      workbook.getWorksheet(LEGACY_PRICES_SHEET) ||
      workbook.getWorksheet('قیمت ها') ||
      workbook.getWorksheet('قیمت‌ها');
    if (!priceSheet) throw new Error('قیمت sheet missing');

    return { names, slugs, skus };
  });

  const products = (await Product.collection
    .find({})
    .project({
      name: 1,
      slug: 1,
      sku: 1,
      price: 1,
      portalPrice: 1,
      stock: 1,
      attributes: 1,
      variants: 1,
      category: 1
    })
    .toArray()) as MongoProductLike[];

  const missing: MongoProductLike[] = [];
  for (const p of products) {
    const nameNorm = normalizeProductText(String(p.name || ''));
    const slugNorm = normalizeProductText(String(p.slug || '').replace(/-/g, '_'));
    const excelSlugNorm = normalizeProductText(
      String(p.attributes?.excelSlug || '').replace(/-/g, '_')
    );
    const variantSkus = (p.variants || []).map((v) => normalizeProductText(String(v.sku || '')));
    const ownSku = normalizeProductText(String(p.sku || ''));

    const inExcel =
      (nameNorm && excelIndex.names.has(nameNorm)) ||
      (slugNorm &&
        [...excelIndex.slugs].some(
          (s) => s === slugNorm || s.startsWith(`${slugNorm}_`) || slugNorm.startsWith(`${s}_`)
        )) ||
      (excelSlugNorm &&
        [...excelIndex.slugs].some(
          (s) =>
            s === excelSlugNorm ||
            s.startsWith(`${excelSlugNorm}_`) ||
            excelSlugNorm.startsWith(`${s}_`)
        )) ||
      (ownSku && excelIndex.skus.has(ownSku)) ||
      variantSkus.some((s) => s && excelIndex.skus.has(s));

    if (!inExcel) missing.push(p);
  }

  const created: Array<{ name: string; sourceRow: number }> = [];
  const failed: Array<{ name: string; reason: string }> = [];

  for (const p of missing) {
    try {
      const result = await ensureMongoProductInExcel(p, { filePath });
      if (result.ok && result.created && result.sourceRow) {
        created.push({ name: String(p.name || ''), sourceRow: result.sourceRow });
      } else if (!result.ok) {
        failed.push({
          name: String(p.name || ''),
          reason: String(result.reason || 'unknown')
        });
      }
    } catch (error) {
      failed.push({
        name: String(p.name || ''),
        reason: error instanceof Error ? error.message : 'error'
      });
    }
  }

  return {
    ok: true as const,
    totalProducts: products.length,
    missingCount: missing.length,
    createdCount: created.length,
    created,
    failed
  };
}
