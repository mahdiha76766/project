import { FEEDAR_PRODUCT_LINE_LIST } from '@/lib/brand/feedar';

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const FEEDAR_SOCIALS = [
  { label: 'تلگرام', href: 'https://t.me/feedarpharmed', icon: 'telegram' },
  { label: 'اینستاگرام', href: 'https://instagram.com/feedarpharmed', icon: 'instagram' },
  { label: 'واتساپ', href: 'https://wa.me/989120000000', icon: 'whatsapp' }
] as const;

export const FEEDAR_HERO_DEFAULT = {
  kicker: 'سفیر تحول نوین سلامتی',
  title: 'تولید داروهای درمانی و ملزومات دارویی',
  description:
    'فیدار فارمد با تکیه بر دانش، فناوری و مواد اولیه استاندارد، در مسیر تولید محصولات دارویی، گیاهی و مکمل‌های سلامت فعالیت می‌کند.',
  image:
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
  decoImage:
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
  primaryCta: { href: '/products', label: 'مشاهده محصولات' },
  secondaryCta: { href: '/about', label: 'درباره فیدار فارمد' }
} as const;

export const FEEDAR_SERVICES = [
  {
    title: 'تولید داروهای درمانی',
    description: 'فرمولاسیون دارویی با کنترل کیفیت و مستندسازی علمی.'
  },
  {
    title: 'فرآورده‌های گیاهی',
    description: 'تولید و فرآوری محصولات گیاهی با استانداردهای روز.'
  },
  {
    title: 'مکمل‌های دارویی',
    description: 'خطوط مکمل برای پشتیبانی علمی از سلامت و پیشگیری.'
  },
  {
    title: 'واردات و صادرات',
    description: 'ارتباط با زنجیره تأمین و شرکای تخصصی داخلی و بین‌المللی.'
  }
] as const;

export const FEEDAR_WHY = [
  {
    title: 'نوآوری در تولید دارو',
    description: 'توسعه محصول بر پایه فناوری، داده و نیازهای واقعی بازار سلامت.'
  },
  {
    title: 'تحقیق و توسعه پیشرفته',
    description: 'واحد R&D برای پایداری فرمولاسیون، ایمنی و مستندسازی علمی.'
  },
  {
    title: 'همکاری‌های علمی',
    description: 'ارتباط با مراکز دانشگاهی، جامعه پزشکی و شرکای تخصصی.'
  },
  {
    title: 'پشتیبانی تخصصی',
    description: 'مشاوره علمی برای همکاران تجاری، داروخانه‌ها و جامعه پزشکی.'
  }
] as const;

export const FEEDAR_PARTNERS = [
  { name: 'سازمان غذا و دارو', href: 'https://www.fda.gov.ir' },
  { name: 'وزارت بهداشت', href: 'https://behdasht.gov.ir' },
  { name: 'دانشگاه علوم پزشکی تهران', href: 'https://tums.ac.ir' },
  { name: 'دانشگاه علوم پزشکی شهید بهشتی', href: 'https://sbmu.ac.ir' },
  { name: 'سازمان نظام پزشکی', href: 'https://irimc.org' },
  { name: 'انجمن داروسازان ایران', href: 'https://iranianpharmacy.org' }
] as const;

export const FEEDAR_ABOUT = {
  mission:
    'توسعه و ارائه محصولات دارویی، گیاهی و مکمل با کیفیت قابل اتکا برای جامعه سلامت ایران.',
  vision:
    'تبدیل‌شدن به مرجع معتبر علمی در تولید و ارتباط تخصصی حوزه دارو و فرآورده‌های سلامت.',
  history:
    'فیدار فارمد فعالیت خود را بر پایه تحقیق، کنترل کیفیت و ارتباط شفاف با جامعه تخصصی بنا کرده است و سه خط اصلی دارویی، گیاهی و مکمل را توسعه می‌دهد.',
  values: [
    { title: 'علم', text: 'تصمیم‌گیری محصول بر اساس شواهد، آزمون و بازبینی تخصصی.' },
    { title: 'کیفیت', text: 'کنترل فرآیند از ماده اولیه تا محصول نهایی.' },
    { title: 'شفافیت', text: 'اطلاع‌رسانی روشن برای همکاران علمی و تجاری.' },
    { title: 'مسئولیت', text: 'تعهد به ایمنی، مستندسازی و استانداردهای صنعت دارو.' }
  ],
  stats: [
    { value: '۳', label: 'خط اصلی محصول' },
    { value: 'R&D', label: 'رویکرد تحقیق‌محور' },
    { value: 'GMP', label: 'نگاه کیفی تولیدی' },
    { value: '۲۴/۷', label: 'دسترسی به منابع علمی' }
  ]
} as const;

export const FEEDAR_RESEARCH = {
  title: 'تحقیق، توسعه و مستندسازی علمی',
  description:
    'واحد تحقیق و توسعه فیدار فارمد روی انتخاب ماده اولیه، پایداری فرمولاسیون و هم‌راستایی محصول با نیازهای بالینی کار می‌کند.',
  stats: [
    { value: '۳', label: 'خانواده محصول' },
    { value: '۱۰۰٪', label: 'تمرکز کیفی' },
    { value: 'علمی', label: 'فرایند تصمیم‌گیری' }
  ]
} as const;

export const FEEDAR_LEGAL_LINKS = [
  { href: '/about', label: 'معرفی شرکت' },
  { href: '/research', label: 'تحقیق و توسعه' },
  { href: '/contact', label: 'ارتباط با ما' }
] as const;

export const PRODUCT_CATEGORY_CARDS = FEEDAR_PRODUCT_LINE_LIST.map((line) => ({
  href: line.href,
  title: line.title,
  description: line.description,
  image:
    line.code === 'PHARMACEUTICAL'
      ? 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80'
      : line.code === 'HERBAL'
        ? 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80'
        : 'https://images.unsplash.com/photo-1584306670957-2f78871011c2?auto=format&fit=crop&w=900&q=80'
}));
