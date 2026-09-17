import 'server-only';

import { getProductTotalStock, type ProductLike } from '@/lib/product/variants';
import { isInStock } from '@/lib/shop/stock-status';

/**
 * Storefront availability: active + total sellable stock > 0.
 * Variant products use sum of variant stocks; simple products use product.stock.
 */
export const AVAILABLE_PRODUCT_MATCH = {
  isActive: true,
  $or: [
    { 'variants.0': { $exists: true }, 'variants.stock': { $gt: 0 } },
    {
      $and: [
        {
          $or: [
            { variants: { $exists: false } },
            { variants: { $size: 0 } },
            { variants: null }
          ]
        },
        { stock: { $gt: 0 } }
      ]
    }
  ]
} as const;

/** Merge availability into an existing Mongo filter (AND semantics). */
export function withAvailableProducts(
  filter: Record<string, unknown> = {}
): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [AVAILABLE_PRODUCT_MATCH as unknown as Record<string, unknown>];

  if (Object.keys(filter).length) {
    clauses.push(filter);
  }

  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

export function isProductAvailable(product: ProductLike | Record<string, unknown> | null | undefined): boolean {
  if (!product) return false;
  if ((product as { isActive?: boolean }).isActive === false) return false;
  return isInStock(getProductTotalStock(product as ProductLike));
}

export function filterAvailableProducts<T extends ProductLike | Record<string, unknown>>(products: T[]): T[] {
  return products.filter((p) => isProductAvailable(p));
}

/** Aggregation $match stage for available storefront products. */
export function availableProductsMatchStage(extra: Record<string, unknown> = {}) {
  return { $match: withAvailableProducts(extra) };
}
