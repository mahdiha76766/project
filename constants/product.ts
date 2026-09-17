export const PRODUCT_USAGE_TYPES = ['EDIBLE', 'NON_EDIBLE', 'TOPICAL', 'BOTH'] as const;
export const PRODUCT_WEIGHT_UNITS = ['g', 'kg', 'ml', 'L'] as const;

export type ProductUsageType = (typeof PRODUCT_USAGE_TYPES)[number];

export const PRODUCT_USAGE_OPTIONS: ReadonlyArray<{ value: ProductUsageType; label: string }> = [
  { value: 'EDIBLE', label: 'خوراکی' },
  { value: 'TOPICAL', label: 'مصرف موضعی' },
  { value: 'BOTH', label: 'خوراکی و موضعی' },
  { value: 'NON_EDIBLE', label: 'غیرخوراکی' }
];

export function normalizeProductUsageType(value: unknown): ProductUsageType {
  const v = String(value || '').trim().toUpperCase();
  if ((PRODUCT_USAGE_TYPES as readonly string[]).includes(v)) return v as ProductUsageType;
  return 'EDIBLE';
}

export function isProductUsageType(value: unknown): value is ProductUsageType {
  return (PRODUCT_USAGE_TYPES as readonly string[]).includes(String(value || '').trim().toUpperCase());
}
