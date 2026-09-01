import { normalizeSiteUrl, DEFAULT_SITE_URL } from '@/lib/seo/site-url';

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
  siteName: 'فیدار فارمد',
  siteTitle: 'فیدار فارمد | محصولات دارویی، گیاهی و مکمل',
  siteDescription:
    'فیدار فارمد مجموعه‌ای دانش‌بنیان در حوزه محصولات دارویی، گیاهی و مکمل‌های سلامت با تمرکز بر تحقیق، کیفیت و ارتباط علمی.',
  keywords: ['فیدار فارمد', 'Feedar Pharmed', 'محصولات دارویی', 'محصولات گیاهی', 'مکمل', 'تحقیق و توسعه'],
  faviconUrl: '/og-default.jpg',
  ogImageUrl: '/og-default.jpg',
  canonicalBaseUrl: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL),
  googleSiteVerification: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  bingSiteVerification: '',
  robotsIndex: true,
  organizationName: 'فیدار فارمد',
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

function sanitizeCanonicalBaseUrl(value?: string) {
  const raw = value?.trim() || '';
  if (!raw || /example\.com|your-domain/i.test(raw)) {
    return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
  }
  return normalizeSiteUrl(raw);
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
    canonicalBaseUrl: sanitizeCanonicalBaseUrl(v.canonicalBaseUrl),
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
