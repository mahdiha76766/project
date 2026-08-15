export const PRICE_PORTAL_SETTINGS_KEY = 'price_portal_settings';

export type PricePortalSettings = {
  enabled: boolean;
  pathSlug: string;
  passwordHash: string;
};

export const defaultPricePortalSettings: PricePortalSettings = {
  enabled: false,
  pathSlug: 'adminpricego',
  passwordHash: ''
};

export function normalizePathSlug(raw: unknown): string {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9-]/g, '');
  return s || 'adminpricego';
}

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'blog',
  'cart',
  'categories',
  'checkout',
  'contact',
  'dashboard',
  'orders',
  'payment',
  'products',
  'robots.txt',
  'sitemap.xml',
  '_next'
]);

export function isReservedPortalSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export function normalizePricePortalSettings(raw: unknown): PricePortalSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<PricePortalSettings>;
  let pathSlug = normalizePathSlug(v.pathSlug);
  if (isReservedPortalSlug(pathSlug)) pathSlug = 'adminpricego';
  return {
    enabled: v.enabled === true,
    pathSlug,
    passwordHash: typeof v.passwordHash === 'string' ? v.passwordHash : ''
  };
}
