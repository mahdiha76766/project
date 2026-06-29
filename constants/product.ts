export const PRODUCT_USAGE_TYPES = ['EDIBLE', 'NON_EDIBLE', 'TOPICAL', 'BOTH'] as const;
export const PRODUCT_WEIGHT_UNITS = ['g', 'kg', 'ml', 'L'] as const;

export type ProductUsageType = (typeof PRODUCT_USAGE_TYPES)[number];

export function normalizeProductUsageType(value: unknown): ProductUsageType {
  const v = String(value || '').trim().toUpperCase();
  if ((PRODUCT_USAGE_TYPES as readonly string[]).includes(v)) return v as ProductUsageType;
  return 'EDIBLE';
}
