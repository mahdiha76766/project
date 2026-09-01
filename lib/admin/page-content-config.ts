import { defaultHomeProductSections, normalizeHomeProductSections } from '@/lib/shop/home-product-sections';

export const SITE_PAGE_CONTENT_KEY = 'site_page_content';

export type HeaderContent = {
  brandName: string;
  brandTagline: string;
  announcement: string;
};

export type FooterContent = {
  aboutHtml: string;
  shopTitle: string;
  accountTitle: string;
  copyright: string;
  bottomNote: string;
};

export type HomeContent = {
  aboutLabel: string;
  aboutTitle: string;
  aboutHtml: string;
  aboutImage: string;
  aboutCtaLabel: string;
  featuresLabel: string;
  featuresTitle: string;
  featuresHtml: string;
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  researchTitle: string;
  researchHtml: string;
  researchImage: string;
  partnersTitle: string;
  partnersText: string;
  ctaTitle: string;
  ctaHtml: string;
  productSections: import('@/lib/shop/home-product-sections').HomeProductSectionConfig[];
};

export type ContactContent = {
  title: string;
  subtitle: string;
  bodyHtml: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  mapLat: number;
  mapLng: number;
  mapZoom: number;
  mapTitle: string;
  telegram: string;
  instagram: string;
  whatsapp: string;
  linkedin: string;
};

export type AboutContent = {
  introduction: string;
  mission: string;
  vision: string;
  history: string;
  valuesText: string;
  statsText: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
};

export type SitePageContent = {
  header: HeaderContent;
  footer: FooterContent;
  home: HomeContent;
  contact: ContactContent;
  about: AboutContent;
};

export const defaultSitePageContent: SitePageContent = {
  header: {
    brandName: 'فیدار فارمد',
    brandTagline: 'دارویی · گیاهی · مکمل',
    announcement: ''
  },
  footer: {
    aboutHtml:
      '<p>فیدار فارمد؛ محصولات دارویی، گیاهی و مکمل با رویکرد علمی، کنترل کیفیت و ارتباط شفاف با جامعه تخصصی.</p>',
    shopTitle: 'محصولات',
    accountTitle: 'حساب کاربری',
    copyright: '© فیدار فارمد',
    bottomNote: 'دارویی · گیاهی · مکمل · تحقیق و توسعه'
  },
  home: {
    aboutLabel: 'درباره ما',
    aboutTitle: 'خدماتی که ما ارائه می‌دهیم',
    aboutHtml:
      '<p>فیدار فارمد مجموعه‌ای دانش‌بنیان در حوزه محصولات دارویی، گیاهی و مکمل است؛ با تمرکز بر تحقیق، استانداردهای کیفی و ارتباط علمی.</p>',
    aboutImage: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
    aboutCtaLabel: 'درباره شرکت',
    featuresLabel: 'رویکرد ما',
    featuresTitle: 'چرا فیدار فارمد؟',
    featuresHtml:
      '<p>انتخاب ماده اولیه، فرمولاسیون پایدار، مستندسازی و ارتباط شفاف با جامعه تخصصی.</p>',
    heroKicker: 'سفیر تحول نوین سلامتی',
    heroTitle: 'تولید داروهای درمانی و ملزومات دارویی',
    heroDescription:
      'فیدار فارمد با تکیه بر دانش، فناوری و مواد اولیه استاندارد، در مسیر تولید محصولات دارویی، گیاهی و مکمل‌های سلامت فعالیت می‌کند.',
    heroImage: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80',
    heroCtaPrimary: 'مشاهده محصولات',
    heroCtaSecondary: 'درباره فیدار فارمد',
    researchTitle: 'تحقیق، توسعه و مستندسازی علمی',
    researchHtml:
      '<p>واحد تحقیق و توسعه فیدار فارمد روی انتخاب ماده اولیه، پایداری فرمولاسیون و هم‌راستایی محصول با نیازهای بالینی کار می‌کند.</p>',
    researchImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80',
    partnersTitle: 'سایت‌ها و سازمان‌های مرتبط',
    partnersText:
      'سازمان غذا و دارو|https://www.fda.gov.ir\nوزارت بهداشت|https://behdasht.gov.ir\nدانشگاه علوم پزشکی تهران|https://tums.ac.ir\nدانشگاه علوم پزشکی شهید بهشتی|https://sbmu.ac.ir\nسازمان نظام پزشکی|https://irimc.org\nانجمن داروسازان ایران|https://iranianpharmacy.org',
    ctaTitle: 'همکاری، مشاوره یا درخواست کاتالوگ',
    ctaHtml:
      '<p>برای ارتباط با تیم علمی و بازرگانی فیدار فارمد از صفحه تماس استفاده کنید یا منابع قابل دانلود را ببینید.</p>',
    productSections: defaultHomeProductSections
  },
  contact: {
    title: 'تماس با ما',
    subtitle: 'ارتباط با تیم علمی و بازرگانی فیدار فارمد.',
    bodyHtml:
      '<p>برای همکاری، درخواست کاتالوگ یا پرسش علمی با ما در ارتباط باشید.</p>',
    phone: '۰۹۱۲۰۰۰۰۰۰۰',
    email: 'info@feedarpharmed.com',
    address: 'ایران',
    hours: 'شنبه تا پنج‌شنبه — ۹ تا ۱۸',
    mapLat: 35.6892,
    mapLng: 51.389,
    mapZoom: 14,
    mapTitle: 'فیدار فارمد',
    telegram: 'https://t.me/feedarpharmed',
    instagram: 'https://instagram.com/feedarpharmed',
    whatsapp: 'https://wa.me/989120000000',
    linkedin: ''
  },
  about: {
    introduction:
      'فیدار فارمد مجموعه‌ای دانش‌بنیان در حوزه محصولات دارویی، گیاهی و مکمل است؛ با تمرکز بر تحقیق، استانداردهای کیفی و ارتباط علمی.',
    mission: 'توسعه و ارائه محصولات دارویی، گیاهی و مکمل با کیفیت قابل اتکا برای جامعه سلامت ایران.',
    vision: 'تبدیل‌شدن به مرجع معتبر علمی در تولید و ارتباط تخصصی حوزه دارو و فرآورده‌های سلامت.',
    history:
      'فیدار فارمد فعالیت خود را بر پایه تحقیق، کنترل کیفیت و ارتباط شفاف با جامعه تخصصی بنا کرده است و سه خط اصلی دارویی، گیاهی و مکمل را توسعه می‌دهد.',
    valuesText:
      'علم|تصمیم‌گیری محصول بر اساس شواهد، آزمون و بازبینی تخصصی.\nکیفیت|کنترل فرآیند از ماده اولیه تا محصول نهایی.\nشفافیت|اطلاع‌رسانی روشن برای همکاران علمی و تجاری.\nمسئولیت|تعهد به ایمنی، مستندسازی و استانداردهای صنعت دارو.',
    statsText: '۳|خط اصلی محصول\nR&D|رویکرد تحقیق‌محور\nGMP|نگاه کیفی تولیدی\n۲۴/۷|دسترسی به منابع علمی',
    image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200&q=80',
    seoTitle: 'درباره فیدار فارمد',
    seoDescription: 'معرفی فیدار فارمد؛ شرکت دارویی با تمرکز بر محصولات دارویی، گیاهی و مکمل.'
  }
};

function asString(v: unknown, fallback: string) {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeSitePageContent(raw: unknown): SitePageContent {
  const base = defaultSitePageContent;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<SitePageContent>;

  return {
    header: {
      brandName: asString(r.header?.brandName, base.header.brandName),
      brandTagline: asString(r.header?.brandTagline, base.header.brandTagline),
      announcement: asString(r.header?.announcement, base.header.announcement)
    },
    footer: {
      aboutHtml: asString(r.footer?.aboutHtml, base.footer.aboutHtml),
      shopTitle: asString(r.footer?.shopTitle, base.footer.shopTitle),
      accountTitle: asString(r.footer?.accountTitle, base.footer.accountTitle),
      copyright: asString(r.footer?.copyright, base.footer.copyright),
      bottomNote: asString(r.footer?.bottomNote, base.footer.bottomNote)
    },
    home: {
      aboutLabel: asString(r.home?.aboutLabel, base.home.aboutLabel),
      aboutTitle: asString(r.home?.aboutTitle, base.home.aboutTitle),
      aboutHtml: asString(r.home?.aboutHtml, base.home.aboutHtml),
      aboutImage: asString(r.home?.aboutImage, base.home.aboutImage),
      aboutCtaLabel: asString(r.home?.aboutCtaLabel, base.home.aboutCtaLabel),
      featuresLabel: asString(r.home?.featuresLabel, base.home.featuresLabel),
      featuresTitle: asString(r.home?.featuresTitle, base.home.featuresTitle),
      featuresHtml: asString(r.home?.featuresHtml, base.home.featuresHtml),
      heroKicker: asString(r.home?.heroKicker, base.home.heroKicker),
      heroTitle: asString(r.home?.heroTitle, base.home.heroTitle),
      heroDescription: asString(r.home?.heroDescription, base.home.heroDescription),
      heroImage: asString(r.home?.heroImage, base.home.heroImage),
      heroCtaPrimary: asString(r.home?.heroCtaPrimary, base.home.heroCtaPrimary),
      heroCtaSecondary: asString(r.home?.heroCtaSecondary, base.home.heroCtaSecondary),
      researchTitle: asString(r.home?.researchTitle, base.home.researchTitle),
      researchHtml: asString(r.home?.researchHtml, base.home.researchHtml),
      researchImage: asString(r.home?.researchImage, base.home.researchImage),
      partnersTitle: asString(r.home?.partnersTitle, base.home.partnersTitle),
      partnersText: asString(r.home?.partnersText, base.home.partnersText),
      ctaTitle: asString(r.home?.ctaTitle, base.home.ctaTitle),
      ctaHtml: asString(r.home?.ctaHtml, base.home.ctaHtml),
      productSections: normalizeHomeProductSections(r.home?.productSections ?? base.home.productSections)
    },
    contact: {
      title: asString(r.contact?.title, base.contact.title),
      subtitle: asString(r.contact?.subtitle, base.contact.subtitle),
      bodyHtml: asString(r.contact?.bodyHtml, base.contact.bodyHtml),
      phone: asString(r.contact?.phone, base.contact.phone),
      email: asString(r.contact?.email, base.contact.email),
      address: asString(r.contact?.address, base.contact.address),
      hours: asString(r.contact?.hours, base.contact.hours),
      mapLat: asNumber(r.contact?.mapLat, base.contact.mapLat),
      mapLng: asNumber(r.contact?.mapLng, base.contact.mapLng),
      mapZoom: asNumber(r.contact?.mapZoom, base.contact.mapZoom),
      mapTitle: asString(r.contact?.mapTitle, base.contact.mapTitle),
      telegram: asString(r.contact?.telegram, base.contact.telegram),
      instagram: asString(r.contact?.instagram, base.contact.instagram),
      whatsapp: asString(r.contact?.whatsapp, base.contact.whatsapp),
      linkedin: asString(r.contact?.linkedin, base.contact.linkedin)
    },
    about: {
      introduction: asString(r.about?.introduction, base.about.introduction),
      mission: asString(r.about?.mission, base.about.mission),
      vision: asString(r.about?.vision, base.about.vision),
      history: asString(r.about?.history, base.about.history),
      valuesText: asString(r.about?.valuesText, base.about.valuesText),
      statsText: asString(r.about?.statsText, base.about.statsText),
      image: asString(r.about?.image, base.about.image),
      seoTitle: asString(r.about?.seoTitle, base.about.seoTitle),
      seoDescription: asString(r.about?.seoDescription, base.about.seoDescription)
    }
  };
}
