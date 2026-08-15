import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url';
import { resolveImage } from '@/lib/shop/resolve-image';

/** Resolve product/blog image path to absolute URL for OG and schema. */
export function resolveOgImage(image?: string | null, fallback = '/og-default.jpg'): string {
  const resolved = resolveImage(image || fallback, fallback);
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved.replace(/^http:\/\//i, 'https://');
  }
  return absoluteUrl(resolved.startsWith('/') ? resolved : `/${resolved}`);
}

export function resolveOgImages(images?: string[] | null, fallback?: string): string[] {
  const list = (images || []).filter(Boolean).map((img) => resolveOgImage(img));
  if (list.length) return list;
  return [resolveOgImage(fallback)];
}

export const SITE_BRAND_NAME = 'ناب سرا';
export const SITE_CONTENT_TEAM = 'تیم محتوای ناب سرا';
