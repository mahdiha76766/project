export type SiteSeoSettings = {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  keywords: string[];
  faviconUrl: string;
  ogImageUrl: string;
  canonicalBaseUrl: string;
  googleSiteVerification: string;
  googleAnalyticsId: string;
  googleTagManagerId: string;
  bingSiteVerification: string;
  robotsIndex: boolean;
  organizationName: string;
  organizationPhone: string;
  twitterHandle: string;
};

export const SITE_SETTINGS_KEY = 'site_seo';

export const defaultSiteSeoSettings: SiteSeoSettings = {
  siteName: 'نابسرا',
  siteTitle: 'فروشگاه روغن و ادویه | نابسرا',
  siteDescription: 'خرید آنلاین روغن‌های طبیعی، ادویه‌های اصیل و محصولات عطاری با ارسال سریع و ضمانت کیفیت.',
  keywords: ['روغن طبیعی', 'ادویه اصیل', 'عطاری آنلاین', 'روغن زیتون', 'زعفران', 'نابسرا'],
  faviconUrl: '/og-default.jpg',
  ogImageUrl: '/og-default.jpg',
  canonicalBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://nabsara.ir',
  googleSiteVerification: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  bingSiteVerification: '',
  robotsIndex: true,
  organizationName: 'نابسرا',
  organizationPhone: '',
  twitterHandle: ''
};

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/[,،]/).map((k) => k.trim()).filter(Boolean);
  }
  return defaultSiteSeoSettings.keywords;
}

export function normalizeSiteSeoSettings(value: unknown): SiteSeoSettings {
  if (!value || typeof value !== 'object') return defaultSiteSeoSettings;
  const v = value as Partial<SiteSeoSettings>;
  return {
    siteName: v.siteName?.trim() || defaultSiteSeoSettings.siteName,
    siteTitle: v.siteTitle?.trim() || defaultSiteSeoSettings.siteTitle,
    siteDescription: v.siteDescription?.trim() || defaultSiteSeoSettings.siteDescription,
    keywords: normalizeKeywords(v.keywords).length ? normalizeKeywords(v.keywords) : defaultSiteSeoSettings.keywords,
    faviconUrl: v.faviconUrl?.trim() || defaultSiteSeoSettings.faviconUrl,
    ogImageUrl: v.ogImageUrl?.trim() || defaultSiteSeoSettings.ogImageUrl,
    canonicalBaseUrl: v.canonicalBaseUrl?.trim() || defaultSiteSeoSettings.canonicalBaseUrl,
    googleSiteVerification: v.googleSiteVerification?.trim() || '',
    googleAnalyticsId: v.googleAnalyticsId?.trim() || '',
    googleTagManagerId: v.googleTagManagerId?.trim() || '',
    bingSiteVerification: v.bingSiteVerification?.trim() || '',
    robotsIndex: v.robotsIndex !== false,
    organizationName: v.organizationName?.trim() || defaultSiteSeoSettings.organizationName,
    organizationPhone: v.organizationPhone?.trim() || '',
    twitterHandle: v.twitterHandle?.trim() || ''
  };
}
