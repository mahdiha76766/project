export const HOME_PRODUCT_FILTERS = [
  'NEWEST',
  'FEATURED',
  'BEST_SELLING',
  'ON_SALE',
  'LOWEST_PRICE',
  'HIGHEST_PRICE',
  'HIGHEST_STOCK',
  'EDIBLE',
  'NON_EDIBLE',
  'RANDOM'
] as const;

export type HomeProductFilterType = (typeof HOME_PRODUCT_FILTERS)[number];

export const HOME_PRODUCT_FILTER_LABELS: Record<HomeProductFilterType, string> = {
  NEWEST: 'جدیدترین',
  FEATURED: 'منتخب / ویژه',
  BEST_SELLING: 'پرفروش‌ترین',
  ON_SALE: 'تخفیف‌دار',
  LOWEST_PRICE: 'ارزان‌ترین',
  HIGHEST_PRICE: 'گران‌ترین',
  HIGHEST_STOCK: 'بیشترین موجودی',
  EDIBLE: 'خوراکی',
  NON_EDIBLE: 'غیر خوراکی',
  RANDOM: 'تصادفی'
};

export const HOME_SECTION_DESIGNS = ['classic', 'minimal', 'accent'] as const;
export type HomeSectionDesign = (typeof HOME_SECTION_DESIGNS)[number];

export type HomeProductSectionConfig = {
  id: string;
  enabled: boolean;
  label: string;
  title: string;
  filterType: HomeProductFilterType;
  design: HomeSectionDesign;
  limit: number;
};

export const defaultHomeProductSections: HomeProductSectionConfig[] = [
  {
    id: 'sec-newest',
    enabled: true,
    label: 'جدید',
    title: 'جدیدترین محصولات',
    filterType: 'NEWEST',
    design: 'classic',
    limit: 10
  },
  {
    id: 'sec-bestseller',
    enabled: true,
    label: 'پرفروش',
    title: 'محصولات پرفروش',
    filterType: 'BEST_SELLING',
    design: 'accent',
    limit: 8
  },
  {
    id: 'sec-sale',
    enabled: true,
    label: 'تخفیف',
    title: 'پیشنهاد ویژه',
    filterType: 'ON_SALE',
    design: 'minimal',
    limit: 10
  }
];

function asBool(v: unknown, fb: boolean) {
  return typeof v === 'boolean' ? v : fb;
}

function asStr(v: unknown, fb: string) {
  return typeof v === 'string' ? v : fb;
}

function asNum(v: unknown, fb: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

export function normalizeHomeProductSections(raw: unknown): HomeProductSectionConfig[] {
  if (!Array.isArray(raw) || !raw.length) return defaultHomeProductSections;
  return raw.map((item, i) => {
    const r = item as Partial<HomeProductSectionConfig>;
    const fb = defaultHomeProductSections[i] || defaultHomeProductSections[0];
    const filterType = HOME_PRODUCT_FILTERS.includes(r.filterType as HomeProductFilterType)
      ? (r.filterType as HomeProductFilterType)
      : fb.filterType;
    const design = HOME_SECTION_DESIGNS.includes(r.design as HomeSectionDesign)
      ? (r.design as HomeSectionDesign)
      : fb.design;

    const legacyTitleMap: Record<string, { title: string; label: string }> = {
      'جدیدترین محصولات': { title: 'جدیدترین محصولات', label: 'جدید' },
      'تازه‌واردهای فروشگاه': { title: 'جدیدترین محصولات', label: 'جدید' },
      'بیشترین خریدها': { title: 'محصولات پرفروش', label: 'پرفروش' },
      'پرفروش‌های این فصل': { title: 'محصولات پرفروش', label: 'پرفروش' },
      'پرفروش‌ترین محصولات': { title: 'محصولات پرفروش', label: 'پرفروش' },
      'پیشنهاد ویژه': { title: 'پیشنهاد ویژه', label: 'تخفیف' },
      'فرصت‌های خرید امروز': { title: 'پیشنهاد ویژه', label: 'تخفیف' }
    };
    const legacyLabelMap: Record<string, string> = {
      'تازه از انبار': 'جدید',
      'انتخاب مشتریان': 'پرفروش',
      'پیشنهاد هوشمند': 'تخفیف'
    };
    const rawTitle = asStr(r.title, fb.title);
    const rawLabel = asStr(r.label, fb.label);
    const upgraded = legacyTitleMap[rawTitle];

    return {
      id: asStr(r.id, fb.id),
      enabled: asBool(r.enabled, fb.enabled),
      label: upgraded?.label || legacyLabelMap[rawLabel] || rawLabel,
      title: upgraded?.title || rawTitle,
      filterType,
      design,
      limit: Math.min(24, Math.max(4, asNum(r.limit, fb.limit)))
    };
  });
}
