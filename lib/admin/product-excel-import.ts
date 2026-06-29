import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getUploadsRoot } from '@/lib/admin/upload-storage';
import { slugify } from '@/lib/utils/slugify';
import { syncProductFieldsFromVariants, type ProductVariant } from '@/lib/product/variants';

export const PRODUCTS_EXCEL_SHEET = 'site_prices';
export const PRODUCTS_EXCEL_FILENAME = 'products.xlsx';

export type ExcelPriceRow = {
  productId: string;
  name: string;
  slug: string;
  categoryName: string;
  variantName: string;
  unit: string;
  rawPrice: string | number;
  priceToman: number;
  status: string;
  sourceRow: number;
  siteKey: string;
};

export type ProductImportResult = {
  ok: boolean;
  filePath: string;
  sheet: string;
  totalRows: number;
  activeRows: number;
  updated: Array<{ name: string; slug: string; priceChanges: number; variantChanges: number }>;
  imported: Array<{ name: string; slug: string; variants: number }>;
  unchanged: number;
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ name: string; message: string }>;
};

const VARIANT_SUFFIX_RE = /_(30ml|60ml|half_liter|1_liter|kil|liter|\d+ml)$/i;

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toAsciiDigits(value: string) {
  return value.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/** تمیزسازی قیمت از فرمت‌های متنی، جداکننده و کاراکتر اضافی */
export function parseExcelPrice(raw: unknown, fallbackToman?: unknown): number {
  if (typeof fallbackToman === 'number' && Number.isFinite(fallbackToman) && fallbackToman > 0) {
    return Math.round(fallbackToman);
  }

  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    // اگر عدد کوچک است (مثل 600) احتمالاً هزار تومان است
    if (raw < 10000) return Math.round(raw * 1000);
    return Math.round(raw);
  }

  let text = toAsciiDigits(String(raw ?? '').trim());
  if (!text) return 0;

  text = text
    .replace(/ریال|تومان|toman|rial/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d./,-]/g, '');

  if (!text) return 0;

  // فرمت 1/150 => 1150 هزار تومان
  if (text.includes('/')) {
    const [whole, fraction] = text.split('/');
    const w = Number(whole);
    const f = Number(fraction);
    if (Number.isFinite(w) && Number.isFinite(f)) return Math.round((w * 1000 + f) * 1000);
  }

  text = text.replace(/,/g, '');
  const num = Number(text);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (num < 10000) return Math.round(num * 1000);
  return Math.round(num);
}

export function normalizeProductText(value: string) {
  return value
    .trim()
    .replace(/\u200c/g, '')
    .replace(/[()（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[ـ]/g, '')
    .toLowerCase();
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/-/g, '_');
}

function rowToExcelItem(row: Record<string, unknown>): ExcelPriceRow | null {
  const name = String(row['نام محصول'] || '').trim();
  const productId = String(row.product_id || row.site_key || '').trim();
  if (!name || !productId) return null;

  const priceToman = parseExcelPrice(row['قیمت خام'], row.price_toman);
  if (!priceToman) return null;

  return {
    productId,
    name,
    slug: String(row.slug || '').trim(),
    categoryName: String(row['دسته‌بندی'] || '').trim(),
    variantName: String(row['نوع/وزن'] || row['واحد'] || 'پیش‌فرض').trim(),
    unit: String(row['واحد'] || '').trim(),
    rawPrice: row['قیمت خام'] as string | number,
    priceToman,
    status: String(row['وضعیت'] || '').trim(),
    sourceRow: Number(row.source_row || 0),
    siteKey: String(row.site_key || productId).trim()
  };
}

export function resolveProductsExcelPath(customPath?: string) {
  if (customPath) return customPath;
  return path.join(getUploadsRoot(), PRODUCTS_EXCEL_FILENAME);
}

export async function readSitePricesSheet(filePath = resolveProductsExcelPath()) {
  const buffer = await fs.readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[PRODUCTS_EXCEL_SHEET];
  if (!sheet) {
    throw new Error(`شیت ${PRODUCTS_EXCEL_SHEET} در فایل اکسل یافت نشد`);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const parsed = rawRows
    .map(rowToExcelItem)
    .filter((row): row is ExcelPriceRow => Boolean(row))
    .filter((row) => row.status === 'فعال');

  return {
    filePath,
    sheet: PRODUCTS_EXCEL_SHEET,
    totalRows: rawRows.length,
    activeRows: parsed,
    grouped: groupRowsByProduct(parsed)
  };
}

export function groupRowsByProduct(rows: ExcelPriceRow[]) {
  const map = new Map<string, ExcelPriceRow[]>();
  for (const row of rows) {
    const key = normalizeProductText(row.name);
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function deriveProductSlug(rows: ExcelPriceRow[]) {
  const slugs = rows.map((r) => r.slug).filter(Boolean);
  if (!slugs.length) return slugify(rows[0]?.name || 'product') || `product-${Date.now()}`;

  if (slugs.length === 1) {
    return slugs[0].replace(VARIANT_SUFFIX_RE, '') || slugs[0];
  }

  const parts = slugs.map((s) => s.split('_'));
  const common: string[] = [];
  const minLen = Math.min(...parts.map((p) => p.length));
  for (let i = 0; i < minLen; i++) {
    const token = parts[0][i];
    if (parts.every((p) => p[i] === token)) common.push(token);
    else break;
  }
  const base = common.join('_');
  return base || slugs[0].replace(VARIANT_SUFFIX_RE, '') || slugs[0];
}

type SiteProduct = {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number;
  variants?: ProductVariant[];
};

function buildMatchIndex(products: SiteProduct[]) {
  const bySlug = new Map<string, SiteProduct>();
  const byName = new Map<string, SiteProduct>();
  const bySku = new Map<string, SiteProduct>();
  const all: SiteProduct[] = products;

  for (const product of products) {
    bySlug.set(normalizeSlug(product.slug), product);
    byName.set(normalizeProductText(product.name), product);
    if (product.sku) bySku.set(normalizeSlug(product.sku), product);
    for (const variant of product.variants || []) {
      if (variant.sku) bySku.set(normalizeSlug(variant.sku), product);
    }
  }

  return { bySlug, byName, bySku, all };
}

export function findMatchingProduct(
  rows: ExcelPriceRow[],
  index: ReturnType<typeof buildMatchIndex>
): SiteProduct | null {
  const first = rows[0];
  if (!first) return null;

  const slugCandidates = new Set<string>();
  for (const row of rows) {
    if (row.slug) {
      slugCandidates.add(normalizeSlug(row.slug));
      slugCandidates.add(normalizeSlug(row.slug.replace(VARIANT_SUFFIX_RE, '')));
    }
  }

  for (const slug of slugCandidates) {
    const hit = index.bySlug.get(slug);
    if (hit) return hit;
  }

  for (const row of rows) {
    const skuHit = index.bySku.get(normalizeSlug(row.productId)) || index.bySku.get(normalizeSlug(row.siteKey));
    if (skuHit) return skuHit;
  }

  const exactName = index.byName.get(normalizeProductText(first.name));
  if (exactName) return exactName;

  const normalizedExcelName = normalizeProductText(first.name);
  for (const product of index.all) {
    const normalizedSiteName = normalizeProductText(product.name);
    if (
      normalizedSiteName === normalizedExcelName ||
      normalizedSiteName.includes(normalizedExcelName) ||
      normalizedExcelName.includes(normalizedSiteName)
    ) {
      return product;
    }
  }

  return null;
}

function variantKey(name: string) {
  return normalizeProductText(name);
}

function buildVariantsFromRows(rows: ExcelPriceRow[], existing: ProductVariant[] = []) {
  const variants: ProductVariant[] = existing.map((v) => ({ ...v }));
  let changed = 0;

  for (const row of rows) {
    const price = row.priceToman;
    const sku = row.productId;
    const vName = row.variantName || 'پیش‌فرض';

    let variant = variants.find(
      (v) =>
        variantKey(v.name) === variantKey(vName) ||
        (v.sku && normalizeSlug(v.sku) === normalizeSlug(sku)) ||
        (row.slug && v.sku && normalizeSlug(v.sku) === normalizeSlug(row.slug))
    );

    if (!variant) {
      variant = {
        name: vName,
        sku,
        price,
        stock: 0,
        containerSize: vName,
        isDefault: variants.length === 0
      };
      variants.push(variant);
      changed += 1;
      continue;
    }

    if (variant.price !== price) {
      variant.price = price;
      changed += 1;
    }
    if (!variant.sku && sku) variant.sku = sku;
    if (!variant.containerSize) variant.containerSize = vName;
  }

  if (variants.length && !variants.some((v) => v.isDefault)) {
    variants[0].isDefault = true;
  }

  return { variants, changed };
}

async function resolveCategoryId(categoryName: string, cache: Map<string, string>) {
  const key = normalizeProductText(categoryName);
  if (cache.has(key)) return cache.get(key)!;

  let categoryId: string | null = null;

  if (categoryName) {
    const found = await Category.findOne({ name: categoryName }).select('_id').lean();
    if (found && !Array.isArray(found)) categoryId = String(found._id);
  }

  if (!categoryId) {
    const fallback = await Category.findOne({ isActive: true }).sort({ createdAt: 1 }).select('_id').lean();
    if (fallback && !Array.isArray(fallback)) categoryId = String(fallback._id);
  }

  if (!categoryId) {
    const created = await Category.create({
      name: categoryName || 'عمومی',
      slug: slugify(categoryName || 'general') || `cat-${Date.now()}`,
      isActive: true
    });
    categoryId = String(created._id);
  }

  cache.set(key, categoryId);
  return categoryId;
}

async function ensureUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let i = 1;
  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }
  return slug;
}

export async function syncProductsFromExcel(options?: { filePath?: string; dryRun?: boolean }) {
  const { filePath, activeRows, grouped, totalRows, sheet } = await readSitePricesSheet(options?.filePath);
  await connectToDatabase();

  const products = (await Product.find().lean()) as unknown as SiteProduct[];
  const index = buildMatchIndex(products);
  const categoryCache = new Map<string, string>();
  const matchedIds = new Set<string>();

  const result: ProductImportResult = {
    ok: true,
    filePath,
    sheet,
    totalRows,
    activeRows: activeRows.length,
    updated: [],
    imported: [],
    unchanged: 0,
    skipped: [],
    errors: []
  };

  for (const [, rows] of grouped) {
    const first = rows[0];
    if (!first) continue;

    try {
      const existing = findMatchingProduct(rows, index);

      if (existing) {
        if (matchedIds.has(existing._id)) {
          result.skipped.push({ name: first.name, reason: 'محصول قبلاً در این اجرا پردازش شده' });
          continue;
        }
        matchedIds.add(existing._id);

        const { variants, changed } = buildVariantsFromRows(rows, existing.variants || []);
        const priceChanges = variants.filter((v, i) => {
          const prev = existing.variants?.[i];
          return prev && prev.price !== v.price;
        }).length;

        if (changed === 0) {
          result.unchanged += 1;
          continue;
        }

        if (!options?.dryRun) {
          const payload = syncProductFieldsFromVariants({
            variants,
            price: existing.price,
            stock: existing.variants?.reduce((s, v) => s + Number(v.stock || 0), 0) || 0,
            sku: existing.sku
          });
          await Product.findByIdAndUpdate(existing._id, {
            variants: payload.variants,
            price: payload.price,
            stock: payload.stock,
            sku: (payload as { sku?: string }).sku || existing.sku
          });
        }

        result.updated.push({
          name: existing.name,
          slug: existing.slug,
          priceChanges,
          variantChanges: changed
        });
        continue;
      }

      const slugBase = deriveProductSlug(rows);
      const slug = await ensureUniqueSlug(slugBase);
      const categoryId = await resolveCategoryId(first.categoryName, categoryCache);
      const { variants } = buildVariantsFromRows(rows);

      if (!options?.dryRun) {
        const payload = syncProductFieldsFromVariants({
          name: first.name,
          slug,
          shortDescription: `${first.name} — ${first.categoryName || 'محصول فروشگاه'}`.slice(0, 240),
          fullDescription: '',
          category: categoryId,
          images: [],
          media: [],
          price: variants[0]?.price || 0,
          stock: 0,
          sku: variants[0]?.sku,
          unit: first.unit || 'piece',
          containerSize: first.variantName,
          usageType: 'EDIBLE',
          attributes: { source: 'excel-import', excelSlug: first.slug },
          tags: [first.categoryName].filter(Boolean),
          variants,
          isActive: true,
          isFeatured: false
        });

        await Product.create(payload);
        index.bySlug.set(normalizeSlug(slug), {
          _id: 'new',
          name: first.name,
          slug,
          price: payload.price as number,
          variants
        });
      }

      result.imported.push({ name: first.name, slug, variants: variants.length });
    } catch (error) {
      result.errors.push({
        name: first.name,
        message: error instanceof Error ? error.message : 'خطای نامشخص'
      });
    }
  }

  return result;
}
