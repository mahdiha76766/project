export const PRODUCT_USAGE_TYPES = ['EDIBLE', 'NON_EDIBLE', 'TOPICAL', 'BOTH'] as const;
export const PRODUCT_WEIGHT_UNITS = ['g', 'kg', 'ml', 'L'] as const;
export const PRODUCT_LINES = ['PHARMACEUTICAL', 'HERBAL', 'SUPPLEMENT'] as const;

export type ProductUsageType = (typeof PRODUCT_USAGE_TYPES)[number];
export type ProductLine = (typeof PRODUCT_LINES)[number];

export function normalizeProductUsageType(value: unknown): ProductUsageType {
  const v = String(value || '').trim().toUpperCase();
  if ((PRODUCT_USAGE_TYPES as readonly string[]).includes(v)) return v as ProductUsageType;
  return 'EDIBLE';
}

export function normalizeProductLine(value: unknown): ProductLine | undefined {
  const v = String(value || '').trim().toUpperCase();
  if ((PRODUCT_LINES as readonly string[]).includes(v)) return v as ProductLine;
  return undefined;
}
