export const FEEDAR_BRAND = {
  nameFa: 'فیدار فارمد',
  nameEn: 'Feedar Pharmed',
  tagline: 'دانش، کیفیت و اعتماد در صنعت دارویی',
  shortTagline: 'دارویی · گیاهی · مکمل',
  description:
    'فیدار فارمد مجموعه‌ای دانش‌بنیان در حوزه محصولات دارویی، گیاهی و مکمل‌های سلامت است؛ با تمرکز بر تحقیق، استانداردهای کیفی و ارتباط علمی با جامعه پزشکی.',
  email: 'info@feedarpharmed.com',
  phone: '',
  contentTeam: 'تیم محتوای فیدار فارمد'
} as const;

export const FEEDAR_NAV = [
  { href: '/', label: 'خانه' },
  {
    href: '/products',
    label: 'محصولات',
    children: [
      { href: '/pharmaceutical', label: 'محصولات دارویی' },
      { href: '/herbal', label: 'محصولات گیاهی' },
      { href: '/supplements', label: 'مکمل‌ها' },
      { href: '/categories', label: 'دسته‌بندی‌ها' }
    ]
  },
  { href: '/research', label: 'تحقیق و توسعه' },
  { href: '/blog', label: 'اخبار و مقالات' },
  { href: '/downloads', label: 'دانلودها' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' }
] as const;

export const FEEDAR_FOOTER_COLUMNS = {
  company: [
    { href: '/about', label: 'درباره شرکت' },
    { href: '/research', label: 'تحقیق و توسعه' },
    { href: '/contact', label: 'تماس با ما' }
  ],
  products: [
    { href: '/pharmaceutical', label: 'محصولات دارویی' },
    { href: '/herbal', label: 'محصولات گیاهی' },
    { href: '/supplements', label: 'مکمل‌ها' },
    { href: '/products', label: 'همه محصولات' }
  ],
  resources: [
    { href: '/blog', label: 'اخبار و مقالات' },
    { href: '/downloads', label: 'کاتالوگ و بروشور' },
    { href: '/categories', label: 'دسته‌بندی‌ها' }
  ]
} as const;

export type FeedarProductLine = 'PHARMACEUTICAL' | 'HERBAL' | 'SUPPLEMENT';

export type FeedarProductLineMeta = {
  code: FeedarProductLine;
  slug: 'pharmaceutical' | 'herbal' | 'supplements';
  href: string;
  title: string;
  shortTitle: string;
  description: string;
  tags: string[];
};

export const FEEDAR_PRODUCT_LINES: Record<FeedarProductLine, FeedarProductLineMeta> = {
  PHARMACEUTICAL: {
    code: 'PHARMACEUTICAL',
    slug: 'pharmaceutical',
    href: '/pharmaceutical',
    title: 'محصولات دارویی',
    shortTitle: 'دارویی',
    description: 'فرمولاسیون‌های دارویی با رویکرد علمی، کنترل کیفیت و مستندسازی دقیق.',
    tags: ['دارویی', 'pharmaceutical', 'pharma', 'دارو']
  },
  HERBAL: {
    code: 'HERBAL',
    slug: 'herbal',
    href: '/herbal',
    title: 'محصولات گیاهی',
    shortTitle: 'گیاهی',
    description: 'محصولات گیاهی بر پایه دانش سنتی و استانداردهای مدرن فرآوری.',
    tags: ['گیاهی', 'herbal', 'herb', 'گیاهان دارویی']
  },
  SUPPLEMENT: {
    code: 'SUPPLEMENT',
    slug: 'supplements',
    href: '/supplements',
    title: 'مکمل‌ها',
    shortTitle: 'مکمل',
    description: 'مکمل‌های سلامت برای پشتیبانی از سبک زندگی علمی و مراقبت پیشگیرانه.',
    tags: ['مکمل', 'supplement', 'supplements', 'ویتامین']
  }
};

export const FEEDAR_PRODUCT_LINE_LIST = Object.values(FEEDAR_PRODUCT_LINES);

export function productLineBySlug(slug: string): FeedarProductLineMeta | null {
  return FEEDAR_PRODUCT_LINE_LIST.find((item) => item.slug === slug) ?? null;
}
