/** Canonical production origin — always non-www, always https. */
export const DEFAULT_SITE_URL = 'https://nabsara.ir';

/** Normalize any site URL to https://nabsara.ir style (no trailing slash, no www). */
export function normalizeSiteUrl(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  let normalized = trimmed.replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.hostname.startsWith('www.')) {
      parsed.hostname = parsed.hostname.slice(4);
    }
    parsed.protocol = 'https:';
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Primary public site origin from env with safe fallback. */
export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
}

/** Build absolute URL for canonical, sitemap, schema, OG. */
export function absoluteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return base;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
