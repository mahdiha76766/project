import type { AnalyticsContentType } from '@/models/Analytics';

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i;

export function isBotUserAgent(ua: string) {
  return BOT_RE.test(ua);
}

export function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!ua) return 'unknown';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  if (/windows|macintosh|linux/i.test(ua)) return 'desktop';
  return 'unknown';
}

export function resolvePageMeta(path: string, title?: string): {
  contentType: AnalyticsContentType;
  contentSlug: string;
} {
  const clean = path.split('?')[0] || '/';
  if (clean.startsWith('/products/')) {
    return { contentType: 'product', contentSlug: clean.replace('/products/', '') };
  }
  if (clean.startsWith('/blog/') && clean !== '/blog') {
    return { contentType: 'blog', contentSlug: clean.replace('/blog/', '') };
  }
  if (clean.startsWith('/categories/')) {
    return { contentType: 'category', contentSlug: clean.replace('/categories/', '') };
  }
  if (clean.startsWith('/checkout')) return { contentType: 'checkout', contentSlug: '' };
  if (clean.startsWith('/dashboard')) return { contentType: 'dashboard', contentSlug: '' };
  if (clean === '/' || clean === '/products' || clean === '/blog' || clean === '/contact') {
    return { contentType: 'page', contentSlug: clean };
  }
  return { contentType: title ? 'other' : 'page', contentSlug: clean };
}

export function shouldTrackPath(path: string, excludePaths: string[]) {
  return !excludePaths.some((prefix) => path.startsWith(prefix));
}
