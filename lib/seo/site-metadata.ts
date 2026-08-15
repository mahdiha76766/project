import type { Metadata } from 'next';
import type { SiteSeoSettings } from '@/lib/admin/site-settings-config';
import { getSiteUrl } from '@/lib/seo/site-url';

export function buildSiteMetadata(seo: SiteSeoSettings, overrides?: Partial<Metadata>): Metadata {
  const base = getSiteUrl();

  const metadata: Metadata = {
    metadataBase: new URL(base),
    title: {
      default: seo.siteTitle,
      template: `%s | ${seo.siteName}`
    },
    description: seo.siteDescription,
    keywords: seo.keywords,
    applicationName: seo.siteName,
    alternates: { canonical: '/' },
    robots: seo.robotsIndex
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: base,
      siteName: seo.siteName,
      title: seo.siteTitle,
      description: seo.siteDescription,
      images: [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: seo.siteName }]
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.siteTitle,
      description: seo.siteDescription,
      images: [seo.ogImageUrl],
      ...(seo.twitterHandle ? { site: seo.twitterHandle } : {})
    },
    icons: {
      icon: seo.faviconUrl,
      shortcut: seo.faviconUrl,
      apple: seo.faviconUrl
    },
    verification: {
      ...(seo.googleSiteVerification ? { google: seo.googleSiteVerification } : {}),
      ...(seo.bingSiteVerification ? { other: { 'msvalidate.01': seo.bingSiteVerification } } : {})
    }
  };

  return { ...metadata, ...overrides };
}
