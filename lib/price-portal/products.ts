import 'server-only';

import mongoose from 'mongoose';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { syncAllPortalProductsToExcel } from '@/lib/admin/product-excel-full-sync';
import { recordPriceHistoryEntry } from '@/lib/price-portal/history';
import { computeSitePrice, normalizeSitePercent } from '@/lib/price-portal/site-price';
import {
  computeWholesalePrice,
  normalizeWholesaleAmount,
  normalizeWholesaleDirection,
  normalizeWholesaleMode,
  normalizeWholesalePercent,
  type WholesaleDirection,
  type WholesaleMode
} from '@/lib/price-portal/wholesale';
import { parseVariantSizeAmount, scalePriceBySizeRatio } from '@/lib/price-portal/variant-size';
import { PRODUCT_WEIGHT_UNIT_LABELS } from '@/lib/product/specs';
import { getProductVariants } from '@/lib/product/variants';
import { statusToStockNumber } from '@/lib/shop/stock-status';
import { coercePriceToman } from '@/lib/shop/price-currency';

export type PricePortalRow = {
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  variantLabel: string;
  variantName: string;
  variantSku: string;
  excelSlug: string;
  /** Comparable size (ml or g) for proportional updates; null if unknown */
  sizeAmount: number | null;
  /** Base / portal price (excel price_toman) */
  price: number;
  /** Selling price stored on product for the shop */
  sitePrice: number;
  hasSitePrice: boolean;
  sitePercent: number | null;
  hasWholesale: boolean;
  wholesaleDirection: WholesaleDirection;
  wholesaleMode: WholesaleMode;
  wholesalePercent: number | null;
  wholesaleAmount: number | null;
  wholesaleQty: string;
  wholesalePrice: number | null;
  discountPrice: number | null;
  inStock: boolean;
  isDefault: boolean;
};

type VariantDoc = {
  _id?: unknown;
  name?: string;
  sku?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  isDefault?: boolean;
  portalPrice?: number;
  hasSitePrice?: boolean;
  sitePercent?: number;
  hasWholesale?: boolean;
  wholesaleDirection?: WholesaleDirection;
  wholesaleMode?: WholesaleMode;
  wholesalePercent?: number;
  wholesaleAmount?: number;
  wholesaleQty?: string;
};

type RawProduct = {
  _id: unknown;
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  updatedAt?: Date | string;
  isActive?: boolean;
  category?: unknown;
  portalPrice?: number;
  hasSitePrice?: boolean;
  sitePercent?: number;
  hasWholesale?: boolean;
  wholesaleDirection?: WholesaleDirection;
  wholesaleMode?: WholesaleMode;
  wholesalePercent?: number;
  wholesaleAmount?: number;
  wholesaleQty?: string;
  attributes?: {
    excelSlug?: string;
    sourceRow?: number;
    portalPrice?: number;
    hasSitePrice?: boolean;
    sitePercent?: number;
    hasWholesale?: boolean;
    wholesaleDirection?: WholesaleDirection;
    wholesaleMode?: WholesaleMode;
    wholesalePercent?: number;
    wholesaleAmount?: number;
    wholesaleQty?: string;
  };
  variants?: VariantDoc[];
};

/** Products may store `_id` as ObjectId (manual/admin) or string (excel import). */
function productIdFilters(id: string): Array<Record<string, unknown>> {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [];

  const filters: Array<Record<string, unknown>> = [{ _id: trimmed }];
  if (mongoose.Types.ObjectId.isValid(trimmed) && String(new mongoose.Types.ObjectId(trimmed)) === trimmed) {
    filters.push({ _id: new mongoose.Types.ObjectId(trimmed) });
  }
  return filters;
}

function formatVariantLabel(v: {
  name: string;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
}) {
  if (v.containerSize) return v.containerSize;
  if (v.weight != null && v.weightUnit) {
    const unit = PRODUCT_WEIGHT_UNIT_LABELS[v.weightUnit] || v.weightUnit;
    return `${v.weight.toLocaleString('fa-IR')} ${unit}`;
  }
  return v.name || 'پیش‌فرض';
}

/** شناسه پایدار واریانت برای UI/API — حتی وقتی _id در Mongo خالی است */
export function resolvePortalVariantKey(
  productId: string,
  variant: {
    _id?: unknown;
    sku?: string;
    name?: string;
    containerSize?: string;
    weight?: number;
    weightUnit?: string;
  },
  index = 0
) {
  if (variant._id) return String(variant._id);
  const sku = String(variant.sku || '').trim();
  if (sku) return `sku:${sku}`;
  const label = formatVariantLabel({
    name: variant.name || 'پیش‌فرض',
    weight: variant.weight,
    weightUnit: variant.weightUnit,
    containerSize: variant.containerSize
  });
  return `idx:${productId}:${index}:${label}`;
}

function variantIdOf(v: { _id?: unknown }) {
  return v._id ? String(v._id) : '';
}

function variantMatchesTarget(
  variant: { _id?: unknown; sku?: string; name?: string; containerSize?: string },
  index: number,
  productId: string,
  targetVariantId: string,
  targetSku: string
) {
  if (targetVariantId) {
    const vid = variantIdOf(variant);
    if (vid && vid === targetVariantId) return true;
    if (targetVariantId.startsWith('sku:')) {
      const sku = String(variant.sku || '').trim();
      if (sku && `sku:${sku}` === targetVariantId) return true;
    }
    if (targetVariantId.startsWith('idx:')) {
      const key = resolvePortalVariantKey(productId, variant, index);
      if (key === targetVariantId) return true;
    }
  }
  if (targetSku) {
    const sku = String(variant.sku || '').trim();
    if (sku && sku === targetSku) return true;
  }
  return false;
}

function resolveVariantSizeAmount(v: {
  name?: string;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
}) {
  if (v.weight != null && Number(v.weight) > 0) {
    const unit = String(v.weightUnit || 'g');
    if (unit === 'kg' || unit === 'L') return Math.round(Number(v.weight) * 1000);
    return Math.round(Number(v.weight));
  }
  return parseVariantSizeAmount(v.containerSize, v.name);
}

function readSiteFields(source: {
  price?: number;
  portalPrice?: number;
  hasSitePrice?: boolean;
  sitePercent?: number;
}) {
  const sitePrice = Math.max(0, Number(source.price || 0));
  const hasSitePrice = Boolean(source.hasSitePrice);
  const rawPercent = Number(source.sitePercent);
  const sitePercent =
    hasSitePrice && Number.isFinite(rawPercent) && rawPercent > 0 ? Math.round(rawPercent) : null;
  const portalPrice =
    typeof source.portalPrice === 'number' && Number.isFinite(source.portalPrice)
      ? Math.max(0, source.portalPrice)
      : sitePrice;

  return { portalPrice, sitePrice, hasSitePrice, sitePercent };
}

function readWholesaleFields(source: {
  hasWholesale?: boolean;
  wholesaleDirection?: WholesaleDirection | string;
  wholesaleMode?: WholesaleMode | string;
  wholesalePercent?: number;
  wholesaleAmount?: number;
  wholesaleQty?: string;
  portalPrice?: number;
  price?: number;
}) {
  const hasWholesale = Boolean(source.hasWholesale);
  const wholesaleDirection = normalizeWholesaleDirection(source.wholesaleDirection);
  const wholesaleMode = normalizeWholesaleMode(source.wholesaleMode);
  const rawPercent = Number(source.wholesalePercent);
  const wholesalePercent =
    hasWholesale && wholesaleMode === 'percent' && Number.isFinite(rawPercent) && rawPercent > 0
      ? Math.round(rawPercent)
      : null;
  const rawAmount = Number(source.wholesaleAmount);
  const wholesaleAmount =
    hasWholesale && wholesaleMode === 'amount' && Number.isFinite(rawAmount) && rawAmount >= 0
      ? Math.round(rawAmount)
      : null;
  const wholesaleQty = hasWholesale ? String(source.wholesaleQty || '').trim() : '';
  const base =
    typeof source.portalPrice === 'number' && Number.isFinite(source.portalPrice)
      ? Math.max(0, source.portalPrice)
      : Math.max(0, Number(source.price || 0));
  const wholesalePrice =
    hasWholesale &&
    ((wholesaleMode === 'percent' && wholesalePercent) ||
      (wholesaleMode === 'amount' && wholesaleAmount != null))
      ? computeWholesalePrice(base, {
          direction: wholesaleDirection,
          mode: wholesaleMode,
          percent: wholesalePercent,
          amount: wholesaleAmount
        })
      : null;

  return {
    hasWholesale,
    wholesaleDirection,
    wholesaleMode,
    wholesalePercent,
    wholesaleAmount,
    wholesaleQty,
    wholesalePrice
  };
}

async function loadRawProduct(productId: string): Promise<RawProduct | null> {
  await connectToDatabase();
  for (const filter of productIdFilters(productId)) {
    const found = (await Product.collection.findOne(filter)) as RawProduct | null;
    if (found) return found;
  }
  return null;
}

async function updateRawProduct(productId: string, update: Record<string, unknown>) {
  for (const filter of productIdFilters(productId)) {
    const result = await Product.collection.updateOne(filter, { $set: update });
    if (result.matchedCount > 0) return result;
  }
  return { matchedCount: 0, modifiedCount: 0 };
}

export async function listPricePortalProducts(): Promise<PricePortalRow[]> {
  await connectToDatabase();
  const products = (await Product.collection
    .find({})
    .sort({ name: 1 })
    .project({
      name: 1,
      slug: 1,
      price: 1,
      discountPrice: 1,
      stock: 1,
      weight: 1,
      weightUnit: 1,
      variants: 1,
      attributes: 1,
      sku: 1,
      portalPrice: 1,
      hasSitePrice: 1,
      sitePercent: 1,
      hasWholesale: 1,
      wholesaleDirection: 1,
      wholesaleMode: 1,
      wholesalePercent: 1,
      wholesaleAmount: 1,
      wholesaleQty: 1
    })
    .toArray()) as RawProduct[];

  const rows: PricePortalRow[] = [];

  for (const p of products) {
    const id = String(p._id);
    const productSlug = String(p.slug || '');
    const excelSlug = String(p.attributes?.excelSlug || productSlug);
    const variants = getProductVariants(p as never);

    if (variants.length <= 1 && !(p.variants?.length)) {
      const v = variants[0];
      const site = readSiteFields({
        price: Number(p.price || v.price || 0),
        portalPrice: p.portalPrice ?? p.attributes?.portalPrice,
        hasSitePrice: p.hasSitePrice ?? p.attributes?.hasSitePrice,
        sitePercent: p.sitePercent ?? p.attributes?.sitePercent
      });
      const wholesale = readWholesaleFields({
        portalPrice: site.portalPrice,
        hasWholesale: p.hasWholesale ?? p.attributes?.hasWholesale,
        wholesaleDirection: p.wholesaleDirection ?? p.attributes?.wholesaleDirection,
        wholesaleMode: p.wholesaleMode ?? p.attributes?.wholesaleMode,
        wholesalePercent: p.wholesalePercent ?? p.attributes?.wholesalePercent,
        wholesaleAmount: p.wholesaleAmount ?? p.attributes?.wholesaleAmount,
        wholesaleQty: p.wholesaleQty ?? p.attributes?.wholesaleQty
      });
      rows.push({
        productId: id,
        variantId: resolvePortalVariantKey(id, v, 0),
        productName: String(p.name),
        productSlug,
        variantLabel: formatVariantLabel(v),
        variantName: v.name || 'پیش‌فرض',
        variantSku: v.sku || String(p.sku || ''),
        excelSlug,
        sizeAmount: resolveVariantSizeAmount(v),
        price: site.portalPrice,
        sitePrice: site.sitePrice,
        hasSitePrice: site.hasSitePrice,
        sitePercent: site.sitePercent,
        hasWholesale: wholesale.hasWholesale,
        wholesaleDirection: wholesale.wholesaleDirection,
        wholesaleMode: wholesale.wholesaleMode,
        wholesalePercent: wholesale.wholesalePercent,
        wholesaleAmount: wholesale.wholesaleAmount,
        wholesaleQty: wholesale.wholesaleQty,
        wholesalePrice: wholesale.wholesalePrice,
        discountPrice:
          typeof p.discountPrice === 'number' && p.discountPrice > 0
            ? p.discountPrice
            : v.discountPrice && v.discountPrice > 0
              ? v.discountPrice
              : null,
        inStock: Number(p.stock ?? v.stock ?? 0) > 0,
        isDefault: true
      });
      continue;
    }

    for (let vi = 0; vi < variants.length; vi++) {
      const v = variants[vi];
      const site = readSiteFields({
        price: Number(v.price || 0),
        portalPrice: (v as VariantDoc).portalPrice,
        hasSitePrice: (v as VariantDoc).hasSitePrice,
        sitePercent: (v as VariantDoc).sitePercent
      });
      const wholesale = readWholesaleFields({
        portalPrice: site.portalPrice,
        hasWholesale: (v as VariantDoc).hasWholesale,
        wholesaleDirection: (v as VariantDoc).wholesaleDirection,
        wholesaleMode: (v as VariantDoc).wholesaleMode,
        wholesalePercent: (v as VariantDoc).wholesalePercent,
        wholesaleAmount: (v as VariantDoc).wholesaleAmount,
        wholesaleQty: (v as VariantDoc).wholesaleQty
      });
      rows.push({
        productId: id,
        variantId: resolvePortalVariantKey(id, v, vi),
        productName: String(p.name),
        productSlug,
        variantLabel: formatVariantLabel(v),
        variantName: v.name || 'پیش‌فرض',
        variantSku: v.sku || '',
        excelSlug,
        sizeAmount: resolveVariantSizeAmount(v),
        price: site.portalPrice,
        sitePrice: site.sitePrice,
        hasSitePrice: site.hasSitePrice,
        sitePercent: site.sitePercent,
        hasWholesale: wholesale.hasWholesale,
        wholesaleDirection: wholesale.wholesaleDirection,
        wholesaleMode: wholesale.wholesaleMode,
        wholesalePercent: wholesale.wholesalePercent,
        wholesaleAmount: wholesale.wholesaleAmount,
        wholesaleQty: wholesale.wholesaleQty,
        wholesalePrice: wholesale.wholesalePrice,
        discountPrice: v.discountPrice && v.discountPrice > 0 ? v.discountPrice : null,
        inStock: Number(v.stock ?? 0) > 0,
        isDefault: Boolean(v.isDefault)
      });
    }
  }

  return rows;
}

const EXCEL_SYNC_ERRORS: Record<string, string> = {
  excel_file_missing: 'فایل اکسل products.xlsx یافت نشد. بدون اکسل ذخیره انجام نمی‌شود.',
  excel_corrupted:
    'فایل اکسل محصولات خراب است. از بکاپ products.xlsx.bak بازیابی کنید یا فایل را دوباره آپلود کنید.',
  sheet_missing: 'شیت site_prices در اکسل یافت نشد.',
  site_prices_missing: 'شیت site_prices یافت نشد.',
  prices_sheet_missing: 'شیت قیمت یافت نشد.',
  site_prices_layout_invalid: 'ساختار شیت site_prices نامعتبر است.'
};

/** بعد از ذخیره Mongo، کل شیت قیمت را از وضعیت فعلی پورتال بازنویسی می‌کند */
async function rewritePortalExcelMirror() {
  const result = await syncAllPortalProductsToExcel();
  if (!result.ok) {
    throw new Error(
      EXCEL_SYNC_ERRORS[String(result.reason || '')] ||
        'همگام‌سازی اکسل با پورتال قیمت ناموفق بود.'
    );
  }
  return result;
}

export async function updatePricePortalPrice(input: {
  productId: string;
  variantId?: string | null;
  variantSku?: string | null;
  price: number;
  discountPrice?: number | null;
  hasSitePrice?: boolean;
  sitePercent?: number | null;
  hasWholesale?: boolean;
  wholesaleDirection?: WholesaleDirection | null;
  wholesaleMode?: WholesaleMode | null;
  wholesalePercent?: number | null;
  wholesaleAmount?: number | null;
  wholesaleQty?: string | null;
  inStock?: boolean;
  /** اختلاف قیمت را به نسبت وزن/حجم روی بقیه واریانت‌ها اعمال کند */
  applyProportional?: boolean;
}) {
  const productId = String(input.productId).trim();
  const raw = await loadRawProduct(productId);
  if (!raw) throw new Error('محصول یافت نشد.');

  const portalPrice = coercePriceToman(input.price);
  const hasSitePrice = Boolean(input.hasSitePrice);
  const sitePercent = hasSitePrice ? normalizeSitePercent(input.sitePercent) : null;
  const sitePrice = hasSitePrice && sitePercent ? computeSitePrice(portalPrice, sitePercent) : portalPrice;

  const hasWholesale = Boolean(input.hasWholesale);
  const wholesaleDirection = hasWholesale
    ? normalizeWholesaleDirection(input.wholesaleDirection)
    : 'less';
  const wholesaleMode = hasWholesale ? normalizeWholesaleMode(input.wholesaleMode) : 'percent';
  const wholesalePercent =
    hasWholesale && wholesaleMode === 'percent'
      ? normalizeWholesalePercent(input.wholesalePercent)
      : null;
  const wholesaleAmount =
    hasWholesale && wholesaleMode === 'amount'
      ? normalizeWholesaleAmount(input.wholesaleAmount)
      : null;
  const wholesalePrice =
    hasWholesale &&
    ((wholesaleMode === 'percent' && wholesalePercent) ||
      (wholesaleMode === 'amount' && wholesaleAmount != null))
      ? computeWholesalePrice(portalPrice, {
          direction: wholesaleDirection,
          mode: wholesaleMode,
          percent: wholesalePercent,
          amount: wholesaleAmount
        })
      : null;

  const discountRaw = input.discountPrice;
  const discountPrice =
    discountRaw != null && Number(discountRaw) > 0 ? Math.max(0, Number(discountRaw)) : null;

  const variants = Array.isArray(raw.variants) ? raw.variants.map((v) => ({ ...v })) : [];
  const targetVariantId = input.variantId ? String(input.variantId) : '';
  const targetSku = input.variantSku ? String(input.variantSku).trim() : '';
  const touchStock = typeof input.inStock === 'boolean';
  const applyProportional = Boolean(input.applyProportional);

  // مقدار عمده اختیاری است؛ اگر خالی باشد از عنوان واریانت استفاده می‌شود
  let wholesaleQty = hasWholesale ? String(input.wholesaleQty || '').trim() : '';

  const wholesalePatch = {
    hasWholesale,
    wholesaleDirection: hasWholesale ? wholesaleDirection : undefined,
    wholesaleMode: hasWholesale ? wholesaleMode : undefined,
    wholesalePercent: wholesalePercent ?? undefined,
    wholesaleAmount: wholesaleAmount ?? undefined,
    wholesaleMultiplier: 1,
    wholesaleQty: hasWholesale ? wholesaleQty : ''
  };

  type SiblingUpdate = {
    variantId: string | null;
    portalPrice: number;
    sitePrice: number;
    hasSitePrice: boolean;
    sitePercent: number | null;
    discountPrice: number | null;
    previousPortal: number;
    previousDiscount: number | null;
  };
  const proportionalUpdates: SiblingUpdate[] = [];

  if (variants.length) {
    let targetIndex = -1;
    for (let i = 0; i < variants.length; i++) {
      if (variantMatchesTarget(variants[i], i, productId, targetVariantId, targetSku)) {
        targetIndex = i;
        break;
      }
    }
    // اگر چند واریانت هست و هدف مشخص نشده، هرگز روی پیش‌فرض ننویس — خطا بده
    if (targetIndex < 0) {
      if (variants.length > 1 && (targetVariantId || targetSku)) {
        throw new Error('واریانت مورد نظر یافت نشد.');
      }
      targetIndex = variants.findIndex((v) => v.isDefault);
      if (targetIndex < 0) targetIndex = 0;
    }

    // تضمین _id پایدار برای جلوگیری از قاطی‌شدن ردیف‌ها در UI
    for (let i = 0; i < variants.length; i++) {
      if (!variants[i]._id) {
        variants[i] = { ...variants[i], _id: new mongoose.Types.ObjectId() };
      }
    }

    const previous = variants[targetIndex];
    if (hasWholesale && !wholesaleQty) {
      wholesaleQty = formatVariantLabel({
        name: previous.name || 'پیش‌فرض',
        weight: previous.weight,
        weightUnit: previous.weightUnit,
        containerSize: previous.containerSize
      });
      wholesalePatch.wholesaleQty = wholesaleQty;
    }
    const previousPortal = readSiteFields(previous).portalPrice;
    const previousDiscount =
      typeof previous?.discountPrice === 'number' && previous.discountPrice > 0
        ? previous.discountPrice
        : null;

    const nextStock = touchStock
      ? statusToStockNumber(Boolean(input.inStock), Number(previous?.stock || 0))
      : previous?.stock;

    variants[targetIndex] = {
      ...previous,
      portalPrice,
      hasSitePrice,
      sitePercent: sitePercent ?? undefined,
      price: sitePrice,
      discountPrice: discountPrice ?? undefined,
      ...wholesalePatch,
      ...(touchStock ? { stock: nextStock } : {})
    };

    const sourceSize = resolveVariantSizeAmount(variants[targetIndex]);
    if (applyProportional && sourceSize && sourceSize > 0 && variants.length > 1) {
      for (let i = 0; i < variants.length; i++) {
        if (i === targetIndex) continue;
        const other = variants[i];
        const otherSize = resolveVariantSizeAmount(other);
        if (!otherSize || otherSize <= 0) continue;

        const otherOldPortal = readSiteFields(other).portalPrice;
        const nextPortal = scalePriceBySizeRatio({
          sourceOldPrice: previousPortal,
          sourceNewPrice: portalPrice,
          sourceSize,
          targetOldPrice: otherOldPortal,
          targetSize: otherSize
        });
        if (nextPortal == null) continue;

        const otherOldDiscount =
          typeof other.discountPrice === 'number' && other.discountPrice > 0
            ? other.discountPrice
            : null;
        let nextDiscount: number | null = otherOldDiscount;
        if (previousDiscount != null || discountPrice != null) {
          const scaledDiscount = scalePriceBySizeRatio({
            sourceOldPrice: previousDiscount ?? 0,
            sourceNewPrice: discountPrice ?? 0,
            sourceSize,
            targetOldPrice: otherOldDiscount ?? 0,
            targetSize: otherSize
          });
          nextDiscount = scaledDiscount != null && scaledDiscount > 0 ? scaledDiscount : null;
        }

        const nextSite =
          hasSitePrice && sitePercent ? computeSitePrice(nextPortal, sitePercent) : nextPortal;

        variants[i] = {
          ...other,
          portalPrice: nextPortal,
          hasSitePrice,
          sitePercent: sitePercent ?? undefined,
          price: nextSite,
          discountPrice: nextDiscount ?? undefined
        };

        proportionalUpdates.push({
          variantId: resolvePortalVariantKey(productId, other, i),
          portalPrice: nextPortal,
          sitePrice: nextSite,
          hasSitePrice,
          sitePercent,
          discountPrice: nextDiscount,
          previousPortal: otherOldPortal,
          previousDiscount: otherOldDiscount
        });
      }
    }

    const def = variants.find((v) => v.isDefault) || variants[0];
    const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
    const result = await updateRawProduct(productId, {
      variants,
      price: def?.price ?? sitePrice,
      discountPrice: def?.discountPrice ?? discountPrice,
      ...wholesalePatch,
      ...(touchStock ? { stock: totalStock } : {})
    });

    if (result.matchedCount === 0) throw new Error('ذخیره نشد — محصول یافت نشد.');

    const savedVariant = variants[targetIndex];
    await recordPriceHistoryEntry({
      productId,
      variantId: resolvePortalVariantKey(productId, savedVariant, targetIndex),
      productName: String(raw.name || ''),
      variantLabel: formatVariantLabel({
        name: savedVariant.name || 'پیش‌فرض',
        weight: savedVariant.weight,
        weightUnit: savedVariant.weightUnit,
        containerSize: savedVariant.containerSize
      }),
      previousPrice: previousPortal,
      previousDiscountPrice: previousDiscount,
      newPrice: portalPrice,
      newDiscountPrice: discountPrice,
      previousSavedAtFallback: raw.updatedAt
    });

    for (const sibling of proportionalUpdates) {
      const v = variants.find(
        (item, idx) => resolvePortalVariantKey(productId, item, idx) === String(sibling.variantId || '')
      );
      if (!v) continue;
      await recordPriceHistoryEntry({
        productId,
        variantId: sibling.variantId,
        productName: String(raw.name || ''),
        variantLabel: formatVariantLabel({
          name: v.name || 'پیش‌فرض',
          weight: v.weight,
          weightUnit: v.weightUnit,
          containerSize: v.containerSize
        }),
        previousPrice: sibling.previousPortal,
        previousDiscountPrice: sibling.previousDiscount,
        newPrice: sibling.portalPrice,
        newDiscountPrice: sibling.discountPrice,
        previousSavedAtFallback: raw.updatedAt
      });
    }

    const excel = await rewritePortalExcelMirror();

    return {
      excel,
      sitePrice,
      portalPrice,
      hasSitePrice,
      sitePercent,
      hasWholesale,
      wholesaleDirection,
      wholesaleMode,
      wholesalePercent,
      wholesaleAmount,
      wholesaleQty,
      wholesalePrice,
      inStock: Number(savedVariant.stock || 0) > 0,
      proportionalUpdates
    };
  }

  const previousPortal = readSiteFields({
    price: raw.price,
    portalPrice: raw.portalPrice ?? raw.attributes?.portalPrice,
    hasSitePrice: raw.hasSitePrice ?? raw.attributes?.hasSitePrice,
    sitePercent: raw.sitePercent ?? raw.attributes?.sitePercent
  }).portalPrice;
  const previousDiscount =
    typeof raw.discountPrice === 'number' && raw.discountPrice > 0 ? raw.discountPrice : null;

  if (hasWholesale && !wholesaleQty) {
    const v = getProductVariants(raw as never)[0];
    wholesaleQty = formatVariantLabel(v);
    wholesalePatch.wholesaleQty = wholesaleQty;
  }

  const nextStock = touchStock
    ? statusToStockNumber(Boolean(input.inStock), Number(raw.stock || 0))
    : raw.stock;

  const result = await updateRawProduct(productId, {
    price: sitePrice,
    portalPrice,
    hasSitePrice,
    sitePercent: sitePercent ?? null,
    discountPrice,
    ...wholesalePatch,
    ...(touchStock ? { stock: nextStock } : {})
  });
  if (result.matchedCount === 0) throw new Error('ذخیره نشد — محصول یافت نشد.');

  await recordPriceHistoryEntry({
    productId,
    variantId: null,
    productName: String(raw.name || ''),
    variantLabel: 'پیش‌فرض',
    previousPrice: previousPortal,
    previousDiscountPrice: previousDiscount,
    newPrice: portalPrice,
    newDiscountPrice: discountPrice,
    previousSavedAtFallback: raw.updatedAt
  });

  const excel = await rewritePortalExcelMirror();
  return {
    excel,
    sitePrice,
    portalPrice,
    hasSitePrice,
    sitePercent,
    hasWholesale,
    wholesaleDirection,
    wholesaleMode,
    wholesalePercent,
    wholesaleAmount,
    wholesaleQty,
    wholesalePrice,
    inStock: Number(nextStock ?? raw.stock ?? 0) > 0,
    proportionalUpdates: [] as SiblingUpdate[]
  };
}

/** Used by admin product update when prices/meta change. */
export async function syncProductPricesToExcel(
  _productId: string,
  _options?: {
    previous?: {
      name?: string;
      slug?: string;
      variants?: Array<{
        _id?: unknown;
        name?: string;
        sku?: string;
        containerSize?: string;
        weight?: number;
        weightUnit?: string;
      }>;
    };
    categoryName?: string | null;
  }
) {
  await rewritePortalExcelMirror();
}
