import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getUploadsRoot } from '@/lib/admin/upload-storage';
import { updateDocByAnyId } from '@/lib/db/find-by-any-id';
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
  if (typeof fallbackToman === 'number' && Number.isFinite(fallbackToman) && fallbackToman >= 0) {
    if (fallbackToman === 0 && (raw === '' || raw == null)) return 0;
    if (fallbackToman > 0) return Math.round(fallbackToman);
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw <= 0) return 0;
    // اگر عدد کوچک است (مثل 600) احتمالاً هزار تومان است
    if (raw < 10000) return Math.round(raw * 1000);
    return Math.round(raw);
  }

  let text = toAsciiDigits(String(raw ?? '').trim());
  if (!text) return 0;

  // علامت‌ها و متن‌های جایگزین → ۰
  if (/^(?:[?؟\-–—_./\\*xX×#]+|n\/?a|null|none|نامشخص|ندارد)$/i.test(text)) {
    return 0;
  }

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

export function resolveProductsExcelPath(_customPath?: string) {
  // Always store/read products.xlsx under UPLOADS_DIR — ignore arbitrary relative paths.
  return path.join(getUploadsRoot(), PRODUCTS_EXCEL_FILENAME);
}

const LEGACY_SHEET = 'قیمت';
const LEGACY_NAME_COL = 'نام محصولات';
const LEGACY_VARIANT_SLOTS = [
  { priceKey: 'قیمت', weightKey: 'وزن' },
  { priceKey: 'قیمت_1', weightKey: 'وزن_1' },
  { priceKey: '__EMPTY', weightKey: '__EMPTY_1' }
] as const;

/** Read site_prices or fall back to legacy قیمت sheet. */
export function readActivePriceRowsFromWorkbook(workbook: XLSX.WorkBook) {
  const siteSheet = workbook.Sheets[PRODUCTS_EXCEL_SHEET];
  if (siteSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(siteSheet, { defval: '' });
    if (rows.length) return { sheet: PRODUCTS_EXCEL_SHEET, rows };
  }

  const legacySheet = workbook.Sheets[LEGACY_SHEET];
  if (!legacySheet) return null;

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(legacySheet, { defval: '' });
  const normalized: Record<string, unknown>[] = [];

  for (const row of raw) {
    const name = String(row[LEGACY_NAME_COL] || '').trim();
    if (!name) continue;

    for (const slot of LEGACY_VARIANT_SLOTS) {
      const rawPrice = row[slot.priceKey];
      if (rawPrice === '' || rawPrice == null) continue;
      const priceToman = parseExcelPrice(rawPrice);
      if (!priceToman) continue;

      const variantName = String(row[slot.weightKey] || 'پیش‌فرض').trim() || 'پیش‌فرض';
      normalized.push({
        'نام محصول': name,
        product_id: `${normalizeProductText(name)}_${normalizeProductText(variantName)}`,
        site_key: `${normalizeProductText(name)}_${normalizeProductText(variantName)}`,
        slug: '',
        'دسته‌بندی': '',
        'نوع/وزن': variantName,
        واحد: variantName,
        'قیمت خام': rawPrice,
        price_toman: priceToman,
        وضعیت: 'فعال',
        source_row: 0
      });
    }
  }

  return { sheet: LEGACY_SHEET, rows: normalized };
}

export async function readSitePricesSheet(filePath = resolveProductsExcelPath()) {
  const buffer = await fs.readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const active = readActivePriceRowsFromWorkbook(workbook);
  if (!active?.rows.length) {
    throw new Error(`شیت ${PRODUCTS_EXCEL_SHEET} یا ${'قیمت'} در فایل اکسل یافت نشد`);
  }

  const parsed = active.rows
    .map(rowToExcelItem)
    .filter((row): row is ExcelPriceRow => Boolean(row))
    .filter((row) => row.status === 'فعال' || row.status === '');

  return {
    filePath,
    sheet: active.sheet,
    totalRows: active.rows.length,
    activeRows: parsed,
    grouped: groupRowsByProduct(parsed)
  };
}

export function groupRowsByProduct(rows: ExcelPriceRow[]) {
  const map = new Map<string, ExcelPriceRow[]>();
  for (const row of rows) {
    // هر ردیف شیت «قیمت» (source_row) = یک محصول منطقی
    // مثلاً روغن کرچک نیم‌لیتر/۱لیتر جدا از ۳۰میل/۶۰میل
    const key =
      row.sourceRow > 0
        ? `source:${row.sourceRow}`
        : `name:${normalizeProductText(row.name)}`;
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

  // مچ فازی (includes) عمداً حذف شد — «روغن کرچک» را به
  // «روغن کرچک برای مو و ابرو» قاطی می‌کرد و نام/قیمت‌ها خراب می‌شد

  return null;
}

function variantKey(name: string) {
  return normalizeProductText(name);
}

function buildVariantsFromRows(
  rows: ExcelPriceRow[],
  existing: ProductVariant[] = [],
  options?: { replace?: boolean }
) {
  const replace = Boolean(options?.replace);
  const variants: ProductVariant[] = replace ? [] : existing.map((v) => ({ ...v }));
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
        portalPrice: price,
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
    if (variant.portalPrice !== price) {
      variant.portalPrice = price;
      changed += 1;
    }
    if (variant.name !== vName) {
      variant.name = vName;
      changed += 1;
    }
    if (variant.containerSize !== vName) {
      variant.containerSize = vName;
      changed += 1;
    }
    if (!variant.sku && sku) {
      variant.sku = sku;
      changed += 1;
    }
  }

  if (replace) {
    // فقط واریانت‌های همین source_row — باقی‌مانده‌های ادغام‌شده حذف می‌شوند
    changed = Math.max(changed, 1);
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

export async function syncProductsFromExcel(options?: {
  filePath?: string;
  dryRun?: boolean;
  /** واریانت‌ها دقیقاً مطابق اکسل (جداسازی source_rowهای ادغام‌شده) */
  replaceVariants?: boolean;
  /** نام محصول را از اکسل روی Mongo بنویس */
  updateNames?: boolean;
}) {
  const { filePath, activeRows, grouped, totalRows, sheet } = await readSitePricesSheet(options?.filePath);
  await connectToDatabase();

  const products = (await Product.find().lean()) as unknown as SiteProduct[];
  const index = buildMatchIndex(products);
  const categoryCache = new Map<string, string>();
  const matchedIds = new Set<string>();
  const claimedSkus = new Set<string>();

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

  const replaceVariants = Boolean(options?.replaceVariants);
  const updateNames = options?.updateNames !== false;

  for (const [, rows] of grouped) {
    const first = rows[0];
    if (!first) continue;

    try {
      // اگر SKU این گروه قبلاً به محصول دیگری اختصاص داده شده، محصول جدید بساز
      const groupSkus = rows.map((r) => normalizeSlug(r.productId)).filter(Boolean);
      const skuAlreadyClaimed = groupSkus.some((s) => claimedSkus.has(s));

      let existing = skuAlreadyClaimed ? null : findMatchingProduct(rows, index);

      // اگر محصول قبلاً برای source_row دیگری پردازش شده، این گروه را محصول جدا کن
      if (existing && matchedIds.has(existing._id) && replaceVariants) {
        existing = null;
      }

      if (existing) {
        matchedIds.add(existing._id);
        for (const s of groupSkus) claimedSkus.add(s);

        const { variants, changed } = buildVariantsFromRows(rows, existing.variants || [], {
          replace: replaceVariants
        });
        const nameChanged =
          updateNames && normalizeProductText(existing.name) !== normalizeProductText(first.name);
        const sourceRow = first.sourceRow > 0 ? first.sourceRow : undefined;

        if (changed === 0 && !nameChanged && !sourceRow) {
          result.unchanged += 1;
          continue;
        }

        if (!options?.dryRun) {
          const payload = syncProductFieldsFromVariants({
            variants,
            price: variants[0]?.price || existing.price,
            portalPrice: (variants[0]?.portalPrice ?? variants[0]?.price) || existing.price,
            stock: existing.variants?.reduce((s, v) => s + Number(v.stock || 0), 0) || 0,
            sku: variants[0]?.sku || existing.sku
          });
          const patch: Record<string, unknown> = {
            variants: payload.variants,
            price: payload.price,
            portalPrice: (payload as { portalPrice?: number }).portalPrice ?? payload.price,
            stock: payload.stock,
            sku: (payload as { sku?: string }).sku || existing.sku,
            'attributes.sourceRow': sourceRow,
            'attributes.excelSlug': first.slug || existing.slug
          };
          if (nameChanged) {
            patch.name = first.name;
            patch.shortDescription = first.name;
          }
          await updateDocByAnyId(Product, existing._id, patch);
        }

        result.updated.push({
          name: nameChanged ? first.name : existing.name,
          slug: existing.slug,
          priceChanges: changed,
          variantChanges: changed
        });
        continue;
      }

      const slugBase = deriveProductSlug(rows);
      const slug = await ensureUniqueSlug(
        replaceVariants && first.sourceRow > 0
          ? `${slugBase || slugify(first.name)}_r${first.sourceRow}`
          : slugBase
      );
      const categoryId = await resolveCategoryId(first.categoryName, categoryCache);
      const { variants } = buildVariantsFromRows(rows, [], { replace: true });

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
          portalPrice: (variants[0]?.portalPrice ?? variants[0]?.price) || 0,
          stock: 0,
          sku: variants[0]?.sku,
          unit: first.unit || 'piece',
          containerSize: first.variantName,
          usageType: 'EDIBLE',
          attributes: {
            source: 'excel-import',
            excelSlug: first.slug,
            sourceRow: first.sourceRow > 0 ? first.sourceRow : undefined
          },
          tags: [first.categoryName].filter(Boolean),
          variants,
          isActive: true,
          isFeatured: false
        });

        await Product.create(payload);
        for (const s of groupSkus) claimedSkus.add(s);
        index.bySlug.set(normalizeSlug(slug), {
          _id: 'new',
          name: first.name,
          slug,
          price: payload.price as number,
          variants
        });
        for (const v of variants) {
          if (v.sku) index.bySku.set(normalizeSlug(v.sku), {
            _id: 'new',
            name: first.name,
            slug,
            price: payload.price as number,
            variants
          });
        }
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
