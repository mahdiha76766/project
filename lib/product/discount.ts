import { getProductVariants, type ProductLike } from '@/lib/product/variants';

export function isDiscounted(price: number, discountPrice?: number | null): boolean {
  return typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < price;
}

export function getDiscountPercent(price: number, discountPrice: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function formatDiscountLabel(percent: number, upTo = false): string {
  const n = percent.toLocaleString('fa-IR');
  return upTo ? `تا ${n}٪` : `${n}٪`;
}

export type ProductDiscountInfo = {
  hasDiscount: boolean;
  percent: number;
  maxPercent: number;
  salePrice: number;
  originalPrice: number;
  label: string;
};

export function getVariantDiscountInfo(variant: { price: number; discountPrice?: number }) {
  const hasDiscount = isDiscounted(variant.price, variant.discountPrice);
  const salePrice = hasDiscount ? variant.discountPrice! : variant.price;
  const percent = hasDiscount ? getDiscountPercent(variant.price, variant.discountPrice!) : 0;
  return { hasDiscount, percent, salePrice, originalPrice: variant.price };
}

export function getProductDiscountInfo(product: ProductLike): ProductDiscountInfo {
  const variants = getProductVariants(product);
  const variantInfos = variants.map((v) => ({ variant: v, ...getVariantDiscountInfo(v) }));
  const discounted = variantInfos.filter((i) => i.hasDiscount);

  if (!discounted.length) {
    const price = Number(product.price || 0);
    const dp = product.discountPrice;
    const hasDiscount = isDiscounted(price, dp);
    const percent = hasDiscount ? getDiscountPercent(price, dp!) : 0;
    return {
      hasDiscount,
      percent,
      maxPercent: percent,
      salePrice: hasDiscount ? dp! : price,
      originalPrice: price,
      label: hasDiscount ? formatDiscountLabel(percent) : ''
    };
  }

  const cheapest = variantInfos.reduce((best, cur) => (!best || cur.salePrice < best.salePrice ? cur : best));
  const maxPercent = Math.max(...discounted.map((i) => i.percent));
  const upTo = discounted.length > 1 && new Set(discounted.map((i) => i.percent)).size > 1;

  return {
    hasDiscount: true,
    percent: cheapest.hasDiscount ? cheapest.percent : maxPercent,
    maxPercent,
    salePrice: cheapest.salePrice,
    originalPrice: cheapest.originalPrice,
    label: formatDiscountLabel(maxPercent, upTo)
  };
}
