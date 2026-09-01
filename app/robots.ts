import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/auth',
        '/auth/',
        '/admin',
        '/admin/',
        '/profile',
        '/profile/',
        '/cart',
        '/checkout',
        '/orders',
        '/unauthorized',
        '/unauthorized/',
        '/orders/'
      ]
    },
    sitemap: absoluteUrl('/sitemap.xml')
  };
}
