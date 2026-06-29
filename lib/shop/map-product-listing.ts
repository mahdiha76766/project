import { getProductDiscountInfo } from '@/lib/product/discount';
import { getProductTotalStock, hasVariants, type ProductLike } from '@/lib/product/variants';
import { resolveImage } from '@/lib/shop/resolve-image';
import type { ShopProduct } from '@/types/shop';

export function mapProductListing(p: Record<string, unknown>, categorySlug = ''): ShopProduct {
  const product = p as ProductLike;
  const discount = getProductDiscountInfo(product);
  const multi = hasVariants(product);
  const images = p.images as string[] | undefined;
  const showStrike = discount.hasDiscount && discount.salePrice < discount.originalPrice;

  return {
    id: String(p._id),
    slug: String(p.slug),
    name: String(p.name),
    shortDescription: String(p.shortDescription || ''),
    fullDescription: String(p.fullDescription || ''),
    category: categorySlug || String((p.category as { slug?: string })?.slug || ''),
    tags: (p.tags as string[]) || [],
    attributes: (p.attributes as Record<string, string>) || {},
    images: images?.length ? images.map((img) => resolveImage(img)) : [resolveImage(undefined)],
    price: showStrike ? discount.originalPrice : discount.salePrice,
    discountPrice: showStrike ? discount.salePrice : undefined,
    stock: getProductTotalStock(product),
    hasVariants: multi,
    type: 'special',
    bestSeller: Boolean(p.isFeatured),
    discountLabel: discount.label
  };
}
