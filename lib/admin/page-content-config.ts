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
};

export type SitePageContent = {
  header: HeaderContent;
  footer: FooterContent;
  home: HomeContent;
  contact: ContactContent;
};

export const defaultSitePageContent: SitePageContent = {
  header: {
    brandName: 'نابسرا',
    brandTagline: 'عطاری آنلاین',
    announcement: ''
  },
  footer: {
    aboutHtml:
      '<p>فروشگاه آنلاین روغن‌های گیاهی، ادویه‌های اصیل و محصولات طبیعی — با استاندارد کیفیت عطاری و ارسال مطمئن.</p>',
    shopTitle: 'فروشگاه',
    accountTitle: 'حساب کاربری',
    copyright: '© نابسرا',
    bottomNote: 'ارسال سراسر کشور · ضمانت اصالت · پشتیبانی آنلاین'
  },
  home: {
    aboutLabel: 'درباره ما',
    aboutTitle: 'عطاری با استاندارد مدرن',
    aboutHtml:
      '<p>نابسرا ترکیبی از سنت عطاری و تجربه خرید آنلاین راحت است. هر محصول با دقت انتخاب، فرآوری و بسته‌بندی می‌شود تا با خیال راحت سفارش دهید.</p>',
    aboutImage: 'https://images.unsplash.com/photo-1505577058444-a3dcf27d9753?w=1200&q=80',
    aboutCtaLabel: 'شروع خرید',
    featuresLabel: 'چرا ما',
    featuresTitle: 'کیفیت که بهش اعتماد دارید',
    featuresHtml:
      '<p>محصولات طبیعی، بسته‌بندی بهداشتی، ارسال مطمئن و پشتیبانی واقعی — همه‌چیز برای خریدی مطمئن.</p>',
    productSections: defaultHomeProductSections
  },
  contact: {
    title: 'تماس با ما',
    subtitle: 'سوال، پیشنهاد یا پیگیری سفارش — خوشحال می‌شویم بشنویم.',
    bodyHtml:
      '<p>برای مشاوره محصول، پیگیری سفارش یا همکاری با ما در ارتباط باشید. تیم پشتیبانی در ساعات کاری پاسخگو است.</p>',
    phone: '۰۹۱۲۰۰۰۰۰۰۰',
    email: 'info@nedico.net',
    address: 'ایران',
    hours: 'شنبه تا پنج‌شنبه — ۹ تا ۱۸',
    mapLat: 35.6892,
    mapLng: 51.389,
    mapZoom: 14,
    mapTitle: 'فروشگاه نابسرا'
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
      mapTitle: asString(r.contact?.mapTitle, base.contact.mapTitle)
    }
  };
}
