import 'server-only';

import { Product } from '@/models';
import { slugify } from '@/lib/utils/slugify';

/** استخراج شماره ترتیبی از کدهایی مثل NS-NEW-0407-1 یا NS-0372-1 */
export function parseProductCodeSeq(raw: unknown): number {
  const text = String(raw || '').trim();
  if (!text) return 0;
  const matched = /^(?:NS-NEW-|NS-)(\d{1,8})(?:-|$)/i.exec(text);
  if (!matched) return 0;
  const n = Number(matched[1]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function formatNewProductId(seq: number, variantIndex1Based: number) {
  const safeSeq = Math.max(1, Math.round(Number(seq) || 1));
  const variant = Math.max(1, Math.round(Number(variantIndex1Based) || 1));
  return `NS-NEW-${String(safeSeq).padStart(4, '0')}-${variant}`;
}

/** اسلاگ پایه از نام — برای فارسی خالی نشود */
export function buildBaseProductSlug(name: string, seq: number) {
  const fromName = slugify(String(name || ''))
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  if (fromName && /[a-z0-9]/i.test(fromName) && fromName.length >= 2) {
    return fromName;
  }
  return `product_${String(Math.max(1, seq)).padStart(4, '0')}`;
}

export function buildVariantProductSlug(baseSlug: string, weight: string, variantIndex: number) {
  const weightSlug = slugify(weight).replace(/-/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (weightSlug) return `${baseSlug}_${weightSlug}`;
  return `${baseSlug}_${Math.max(1, variantIndex)}`;
}

/** بزرگ‌ترین NS-NEW / NS در Mongo (sku سطح محصول + واریانت‌ها) */
export async function nextMongoProductSeq(): Promise<number> {
  const rows = await Product.find({
    $or: [{ sku: /^NS-/i }, { 'variants.sku': /^NS-/i }]
  })
    .select('sku variants.sku')
    .lean();

  let max = 0;
  for (const row of rows as Array<{ sku?: string; variants?: Array<{ sku?: string }> }>) {
    max = Math.max(max, parseProductCodeSeq(row.sku));
    const variants = Array.isArray(row.variants) ? row.variants : [];
    for (const v of variants) {
      max = Math.max(max, parseProductCodeSeq(v.sku));
    }
  }
  return max + 1;
}

export async function productSkuExists(sku: string): Promise<boolean> {
  const value = String(sku || '').trim();
  if (!value) return false;
  const found = await Product.exists({
    $or: [{ sku: value }, { 'variants.sku': value }]
  });
  return Boolean(found);
}

export async function anyProductSkuExists(skus: string[]): Promise<boolean> {
  const list = [...new Set(skus.map((s) => String(s || '').trim()).filter(Boolean))];
  if (!list.length) return false;
  const found = await Product.exists({
    $or: [{ sku: { $in: list } }, { 'variants.sku': { $in: list } }]
  });
  return Boolean(found);
}

export async function ensureUniqueProductSlug(baseSlug: string): Promise<string> {
  const normalized = String(baseSlug || '')
    .trim()
    .replace(/-/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  let slug = (normalized || `product_${Date.now()}`).replace(/_/g, '-');
  const base = slug;
  let i = 2;
  while (await Product.exists({ slug })) {
    slug = `${base}-${i}`;
    i += 1;
    if (i > 5000) {
      slug = `${base}-${Date.now()}`;
      break;
    }
  }
  return slug;
}

export function isDuplicateKeyError(error: unknown): boolean {
  const err = error as { code?: number; message?: string };
  if (err?.code === 11000) return true;
  return /E11000|duplicate key/i.test(String(err?.message || error || ''));
}
