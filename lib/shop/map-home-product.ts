import { getProductMinPrice, getProductVariants, hasVariants, serializeVariantsForClient } from '@/lib/product/variants';
import { getProductDiscountInfo } from '@/lib/product/discount';
import { resolveImage } from '@/lib/shop/resolve-image';
import type { HomeProduct } from '@/lib/shop/home-types';

const NEW_PRODUCT_MS = 30 * 24 * 60 * 60 * 1000;

export function mapHomeProduct(p: Record<string, unknown>): HomeProduct {
  const variantRows = serializeVariantsForClient(getProductVariants(p as never));
  const multi = hasVariants(p as never);
  const defaultVariant = variantRows.find((v) => v.isDefault) || variantRows[0];
  const images = p.images as string[] | undefined;
  const discount = getProductDiscountInfo(p as never);
  const createdAt = p.createdAt ? new Date(p.createdAt as string | Date) : null;
  const isNew = createdAt ? Date.now() - createdAt.getTime() < NEW_PRODUCT_MS : false;

  return {
    id: String(p._id),
    slug: String(p.slug),
    name: String(p.name),
    shortDescription: String(p.shortDescription || ''),
    images: images?.length ? images.map((img) => resolveImage(img)) : [resolveImage(undefined)],
    price: Number(p.price || 0),
    discountPrice: typeof p.discountPrice === 'number' ? p.discountPrice : undefined,
    bestSeller: Boolean(p.isFeatured),
    hasVariants: multi,
    minPrice: multi ? getProductMinPrice(p as never) : undefined,
    defaultVariantId: defaultVariant?.id,
    variants: variantRows,
    discountLabel: discount.hasDiscount ? discount.label : undefined,
    soldCount: typeof p.soldCount === 'number' ? p.soldCount : undefined,
    isNew,
    createdAt: createdAt?.toISOString()
  };
}
