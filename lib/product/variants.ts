import type { PRODUCT_WEIGHT_UNITS } from '@/constants/product';
import { productWeightToGrams } from '@/lib/product/specs';

export type ProductVariant = {
  _id?: string;
  name: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  portalPrice?: number;
  hasSitePrice?: boolean;
  sitePercent?: number;
  hasWholesale?: boolean;
  wholesaleDirection?: 'less' | 'more';
  wholesaleMode?: 'percent' | 'amount';
  wholesalePercent?: number;
  wholesaleAmount?: number;
  wholesaleQty?: string;
  stock: number;
  weight?: number;
  weightUnit?: (typeof PRODUCT_WEIGHT_UNITS)[number];
  containerSize?: string;
  isDefault?: boolean;
};

export type ProductLike = {
  _id?: string;
  name?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  sku?: string;
  weight?: number;
  weightUnit?: string;
  variants?: ProductVariant[];
};

export function hasVariants(product: ProductLike | null | undefined) {
  return Boolean(product?.variants?.length);
}

export function getProductVariants(product: ProductLike): ProductVariant[] {
  if (product.variants?.length) return product.variants;
  return [{
    name: 'پیش‌فرض',
    price: Number(product.price || 0),
    discountPrice: product.discountPrice,
    stock: Number(product.stock || 0),
    sku: product.sku,
    weight: product.weight,
    weightUnit: product.weightUnit as ProductVariant['weightUnit'],
    isDefault: true
  }];
}

export function getDefaultVariant(product: ProductLike): ProductVariant {
  const variants = getProductVariants(product);
  return variants.find((v) => v.isDefault) || variants[0];
}

export function resolveVariantId(variant: ProductVariant | null | undefined) {
  return variant?._id ? String(variant._id) : undefined;
}

export function findVariant(product: ProductLike, variantId?: string | null): ProductVariant | undefined {
  const variants = product.variants?.length ? product.variants : getProductVariants(product);
  if (!variantId) return variants.find((v) => v.isDefault) || variants[0];

  const id = String(variantId).trim();
  const byId = variants.find((v) => v._id && String(v._id) === id);
  if (byId) return byId;

  const indexMatch = /^variant-(\d+)$/.exec(id);
  if (indexMatch) {
    const idx = Number(indexMatch[1]);
    if (variants[idx]) return variants[idx];
  }

  const byName = variants.find((v) => v.name === id);
  if (byName) return byName;

  return variants.find((v) => v.isDefault) || variants[0];
}

export function getVariantUnitPrice(variant: ProductVariant | ProductLike) {
  const v = variant as ProductVariant;
  return v.discountPrice ?? v.price ?? 0;
}

export function getProductMinPrice(product: ProductLike) {
  const variants = getProductVariants(product);
  return Math.min(...variants.map(getVariantUnitPrice));
}

export function getProductTotalStock(product: ProductLike) {
  if (product.variants?.length) {
    return product.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }
  return Number(product.stock || 0);
}

export function variantInStock(variant: ProductVariant, quantity = 1) {
  return Number(variant.stock || 0) >= quantity;
}

export function getVariantWeightGrams(variant: ProductVariant, product?: ProductLike) {
  if (variant.weight != null) return productWeightToGrams(variant.weight, variant.weightUnit);
  if (product?.weight != null) return productWeightToGrams(product.weight, product.weightUnit);
  return 0;
}

export function cartLineKey(productId: string, variantId?: string | null) {
  return `${productId}:${variantId || ''}`;
}

export function normalizeVariantsInput(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw) || !raw.length) return [];
  const variants = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const v = item as Partial<ProductVariant> & { _id?: string };
      const name = String(v.name || '').trim();
      if (!name) return null;
      return {
        ...(v._id ? { _id: String(v._id) } : {}),
        name,
        sku: String(v.sku || '').trim(),
        price: Math.max(0, Number(v.price || 0)),
        discountPrice: v.discountPrice != null ? Math.max(0, Number(v.discountPrice)) : undefined,
        ...(typeof (v as { portalPrice?: number }).portalPrice === 'number'
          ? { portalPrice: Math.max(0, Number((v as { portalPrice?: number }).portalPrice)) }
          : {}),
        ...(typeof (v as { hasSitePrice?: boolean }).hasSitePrice === 'boolean'
          ? { hasSitePrice: Boolean((v as { hasSitePrice?: boolean }).hasSitePrice) }
          : {}),
        ...(typeof (v as { sitePercent?: number }).sitePercent === 'number'
          ? { sitePercent: Math.max(0, Math.min(100, Number((v as { sitePercent?: number }).sitePercent))) }
          : {}),
        ...(typeof (v as { hasWholesale?: boolean }).hasWholesale === 'boolean'
          ? { hasWholesale: Boolean((v as { hasWholesale?: boolean }).hasWholesale) }
          : {}),
        ...((v as { wholesaleDirection?: string }).wholesaleDirection === 'more' ||
        (v as { wholesaleDirection?: string }).wholesaleDirection === 'less'
          ? {
              wholesaleDirection: (v as { wholesaleDirection: 'less' | 'more' }).wholesaleDirection
            }
          : {}),
        ...(typeof (v as { wholesalePercent?: number }).wholesalePercent === 'number'
          ? {
              wholesalePercent: Math.max(
                0,
                Math.min(100, Number((v as { wholesalePercent?: number }).wholesalePercent))
              )
            }
          : {}),
        ...((v as { wholesaleMode?: string }).wholesaleMode === 'amount' ||
        (v as { wholesaleMode?: string }).wholesaleMode === 'percent'
          ? {
              wholesaleMode: (v as { wholesaleMode: 'percent' | 'amount' }).wholesaleMode
            }
          : {}),
        ...(typeof (v as { wholesaleAmount?: number }).wholesaleAmount === 'number'
          ? {
              wholesaleAmount: Math.max(0, Number((v as { wholesaleAmount?: number }).wholesaleAmount))
            }
          : {}),
        ...(typeof (v as { wholesaleQty?: string }).wholesaleQty === 'string'
          ? { wholesaleQty: String((v as { wholesaleQty?: string }).wholesaleQty || '').trim() }
          : {}),
        stock: Math.max(0, Number(v.stock || 0)),
        weight: v.weight != null ? Number(v.weight) : undefined,
        weightUnit: (v.weightUnit || 'g') as ProductVariant['weightUnit'],
        containerSize: String(v.containerSize || '').trim(),
        isDefault: Boolean(v.isDefault)
      } satisfies ProductVariant;
    })
    .filter(Boolean) as ProductVariant[];

  if (variants.length && !variants.some((v) => v.isDefault)) {
    variants[0].isDefault = true;
  } else if (variants.length > 1) {
    let seenDefault = false;
    for (const v of variants) {
      if (v.isDefault) {
        if (seenDefault) v.isDefault = false;
        else seenDefault = true;
      }
    }
    if (!seenDefault) variants[0].isDefault = true;
  }
  return variants;
}

export function syncProductFieldsFromVariants<T extends Record<string, unknown>>(body: T & { variants?: ProductVariant[] }) {
  if (!body.variants?.length) return body;
  const def = body.variants.find((v) => v.isDefault) || body.variants[0];
  return {
    ...body,
    price: def.price,
    discountPrice: def.discountPrice,
    stock: body.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0),
    sku: def.sku || body.sku,
    weight: def.weight ?? body.weight,
    weightUnit: def.weightUnit || body.weightUnit
  };
}

export function serializeVariantsForClient(variants?: ProductVariant[]) {
  return (variants || []).map((v, index) => ({
    id: String(v._id || `variant-${index}`),
    name: v.name,
    sku: v.sku || '',
    price: Number(v.price || 0),
    discountPrice: typeof v.discountPrice === 'number' ? v.discountPrice : undefined,
    stock: Number(v.stock || 0),
    weight: v.weight,
    weightUnit: v.weightUnit,
    containerSize: v.containerSize || '',
    isDefault: Boolean(v.isDefault)
  }));
}
