import { PRODUCT_USAGE_TYPES, PRODUCT_WEIGHT_UNITS, PRODUCT_LINES } from '@/constants/product';

export const PRODUCT_USAGE_LABELS: Record<string, string> = {
  EDIBLE: 'خوراکی',
  NON_EDIBLE: 'غیر خوراکی',
  TOPICAL: 'موضعی / بهداشتی',
  BOTH: 'هر دو (خوراکی و غیر خوراکی)'
};

export const PRODUCT_WEIGHT_UNIT_LABELS: Record<string, string> = {
  g: 'گرم',
  kg: 'کیلوگرم',
  ml: 'میلی‌لیتر',
  L: 'لیتر'
};

export const PRODUCT_SPEC_FIELD_LABELS: Record<string, string> = {
  origin: 'منشأ / کشور مبدأ',
  extraction: 'روش استخراج',
  ingredients: 'مواد تشکیل‌دهنده',
  form: 'شکل دارویی',
  dosage: 'دوز مصرف',
  indications: 'موارد مصرف',
  brochure: 'بروشور / فایل علمی',
  storage: 'شرایط نگهداری',
  shelfLife: 'مدت ماندگاری',
  purity: 'درجه خلوص / کیفیت',
  aroma: 'عرق و بو',
  usage: 'کاربرد پیشنهادی'
};

export type ProductSpecForm = {
  weight?: string;
  weightUnit?: string;
  containerSize?: string;
  usageType?: string;
  origin?: string;
  extraction?: string;
  ingredients?: string;
  form?: string;
  dosage?: string;
  indications?: string;
  brochure?: string;
  storage?: string;
  shelfLife?: string;
  purity?: string;
  aroma?: string;
  usage?: string;
};

export function buildProductAttributes(form: ProductSpecForm, existing?: Record<string, string>) {
  const attrs: Record<string, string> = { ...(existing || {}) };
  const specKeys = ['origin', 'extraction', 'ingredients', 'form', 'dosage', 'indications', 'brochure', 'storage', 'shelfLife', 'purity', 'aroma', 'usage'] as const;
  for (const key of specKeys) {
    const val = form[key]?.trim();
    if (val) attrs[key] = val;
    else delete attrs[key];
  }
  return attrs;
}

export function extractProductSpecForm(product: {
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  usageType?: string;
  attributes?: Record<string, string>;
}) {
  const attrs = product.attributes || {};
  return {
    weight: product.weight != null ? String(product.weight) : '',
    weightUnit: product.weightUnit || 'g',
    containerSize: product.containerSize || '',
    usageType: product.usageType || 'EDIBLE',
    origin: attrs.origin || '',
    extraction: attrs.extraction || '',
    ingredients: attrs.ingredients || '',
    form: attrs.form || '',
    dosage: attrs.dosage || '',
    indications: attrs.indications || '',
    brochure: attrs.brochure || '',
    storage: attrs.storage || '',
    shelfLife: attrs.shelfLife || '',
    purity: attrs.purity || '',
    aroma: attrs.aroma || '',
    usage: attrs.usage || ''
  };
}

export function getProductSpecEntries(product: {
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  usageType?: string;
  attributes?: Record<string, string>;
}) {
  const entries: Array<{ label: string; value: string }> = [];

  if (product.weight != null && product.weight > 0) {
    const unit = PRODUCT_WEIGHT_UNIT_LABELS[product.weightUnit || 'g'] || product.weightUnit || '';
    entries.push({ label: 'وزن', value: `${product.weight.toLocaleString('fa-IR')} ${unit}` });
  }
  if (product.containerSize) {
    entries.push({ label: 'اندازه ظرف', value: product.containerSize });
  }
  if (product.usageType) {
    entries.push({ label: 'نوع کاربرد', value: PRODUCT_USAGE_LABELS[product.usageType] || product.usageType });
  }

  const attrs = product.attributes || {};
  for (const [key, label] of Object.entries(PRODUCT_SPEC_FIELD_LABELS)) {
    if (attrs[key]) entries.push({ label, value: attrs[key] });
  }

  return entries;
}

export function getVariantSpecEntries(
  variant: {
    name?: string;
    weight?: number;
    weightUnit?: string;
    containerSize?: string;
  },
  product: {
    weight?: number;
    weightUnit?: string;
    containerSize?: string;
    usageType?: string;
    attributes?: Record<string, string>;
  }
) {
  const merged = {
    weight: variant.weight ?? product.weight,
    weightUnit: variant.weightUnit || product.weightUnit,
    containerSize: variant.containerSize || variant.name || product.containerSize,
    usageType: product.usageType,
    attributes: product.attributes
  };
  return getProductSpecEntries(merged);
}

export const PRODUCT_LINE_LABELS: Record<string, string> = {
  PHARMACEUTICAL: 'دارویی',
  HERBAL: 'گیاهی',
  SUPPLEMENT: 'مکمل'
};

export const usageTypeOptions = PRODUCT_USAGE_TYPES.map((v) => ({
  value: v,
  label: PRODUCT_USAGE_LABELS[v]
}));

export const productLineOptions = PRODUCT_LINES.map((v) => ({
  value: v,
  label: PRODUCT_LINE_LABELS[v]
}));

export const weightUnitOptions = PRODUCT_WEIGHT_UNITS.map((v) => ({
  value: v,
  label: PRODUCT_WEIGHT_UNIT_LABELS[v]
}));

/** تبدیل وزن محصول به گرم برای محاسبه هزینه پست */
export function productWeightToGrams(weight?: number, unit = 'g') {
  if (!weight || weight <= 0) return 500;
  switch (unit) {
    case 'kg':
      return weight * 1000;
    case 'g':
      return weight;
    case 'ml':
      return weight;
    case 'L':
      return weight * 1000;
    default:
      return weight;
  }
}

/** نگاشت وضعیت‌های قدیمی به وضعیت نمایشی */
export function normalizeOrderStatus(status: string) {
  if (status === 'PACKED') return 'PROCESSING';
  return status;
}
