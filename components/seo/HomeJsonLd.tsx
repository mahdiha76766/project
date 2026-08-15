import type { SiteSeoSettings } from '@/lib/admin/site-settings-config';
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url';

export function HomeJsonLd({ seo }: { seo: SiteSeoSettings }) {
  const base = getSiteUrl();
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: seo.siteName,
        description: seo.siteDescription,
        inLanguage: 'fa-IR',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/products?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: seo.organizationName || seo.siteName,
        url: base,
        logo: absoluteUrl(seo.faviconUrl.startsWith('/') ? seo.faviconUrl : `/${seo.faviconUrl}`),
        ...(seo.organizationPhone ? { telephone: seo.organizationPhone } : {})
      },
      {
        '@type': 'Store',
        '@id': `${base}/#store`,
        name: seo.siteName,
        description: seo.siteDescription,
        url: base,
        image: absoluteUrl(seo.ogImageUrl.startsWith('/') ? seo.ogImageUrl : `/${seo.ogImageUrl}`),
        priceRange: '$$'
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
