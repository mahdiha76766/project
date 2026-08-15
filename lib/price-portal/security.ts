import 'server-only';

import { z } from 'zod';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logInfo, logError } from '@/lib/monitoring/logger';
import { coercePriceToman } from '@/lib/shop/price-currency';

const priceTomanField = z.preprocess(
  (v) => coercePriceToman(v),
  z.number().finite().min(0).max(999_999_999_999)
);

const failedLogins = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function normalizeHostname(value: string): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  try {
    const host = raw.includes('://') ? new URL(raw).hostname : raw.split('/')[0];
    return host.split(':')[0].replace(/^www\./, '');
  } catch {
    return raw.split(':')[0].replace(/^www\./, '');
  }
}

/** Hostnames allowed for portal mutations (site URL + request host). */
function trustedHostnames(req: Request): Set<string> {
  const trusted = new Set<string>();
  // Always trust the production brand domain + whatever is configured in env.
  for (const candidate of [
    'https://nabsara.ir',
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL
  ]) {
    const normalized = normalizeHostname(candidate || '');
    if (normalized) trusted.add(normalized);
  }

  const forwarded = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || '';
  const host = req.headers.get('host') || '';
  for (const candidate of [forwarded, host]) {
    const normalized = normalizeHostname(candidate);
    // Ignore loopback / private proxy hosts — Origin should match the public site instead.
    if (
      normalized &&
      normalized !== 'localhost' &&
      normalized !== '127.0.0.1' &&
      !normalized.endsWith('.local')
    ) {
      trusted.add(normalized);
    }
  }
  return trusted;
}

/**
 * Reject cross-site mutation requests in production.
 * Tolerates reverse proxies where Host is internal but Origin is the public site.
 */
export function assertSameOrigin(req: Request) {
  if (process.env.NODE_ENV !== 'production') return true;

  const trusted = trustedHostnames(req);
  if (!trusted.size) return false;

  const origin = req.headers.get('origin');
  if (!origin) {
    const fetchSite = req.headers.get('sec-fetch-site');
    if (fetchSite === 'same-origin' || fetchSite === 'same-site') return true;
    // Same-tab requests without Origin/Sec-Fetch are rare; only accept if Host is trusted public site.
    const requestHost = normalizeHostname(
      req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || req.headers.get('host') || ''
    );
    return Boolean(requestHost && trusted.has(requestHost));
  }

  try {
    const originHost = normalizeHostname(origin);
    return Boolean(originHost && trusted.has(originHost));
  } catch {
    return false;
  }
}

export function checkPortalLoginRate(ip: string) {
  return checkRateLimit(`price-portal:login:${ip}`, 5, 15 * 60_000);
}

export function checkPortalReadRate(ip: string) {
  return checkRateLimit(`price-portal:read:${ip}`, 30, 60_000);
}

export function checkPortalWriteRate(ip: string) {
  return checkRateLimit(`price-portal:write:${ip}`, 40, 60_000);
}

export function registerFailedLogin(ip: string) {
  const now = Date.now();
  const current = failedLogins.get(ip);
  if (!current || current.resetAt < now) {
    failedLogins.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return 1;
  }
  current.count += 1;
  failedLogins.set(ip, current);
  return current.count;
}

export function clearFailedLogins(ip: string) {
  failedLogins.delete(ip);
}

export async function loginBackoffMs(ip: string) {
  const entry = failedLogins.get(ip);
  if (!entry || entry.count < 2) return 0;
  const steps = Math.min(entry.count - 1, 5);
  return Math.min(8000, 400 * 2 ** steps);
}

export const priceUpdateSchema = z
  .object({
    productId: z.string().trim().min(1).max(64),
    variantId: z.string().trim().max(120).nullable().optional(),
    variantSku: z.string().trim().max(80).nullable().optional(),
    /** Base / portal price (excel price_toman) — خالی/?/؟ → ۰ */
    price: priceTomanField,
    discountPrice: z.preprocess((v) => {
      if (v === null || v === undefined || v === '') return null;
      return coercePriceToman(v);
    }, z.union([z.number().finite().min(0).max(999_999_999_999), z.null()]).optional()),
    hasSitePrice: z.boolean().optional().default(false),
    sitePercent: z
      .union([z.coerce.number().finite().min(1).max(100), z.null()])
      .optional(),
    hasWholesale: z.boolean().optional().default(false),
    wholesaleDirection: z.enum(['less', 'more']).optional().default('less'),
    wholesaleMode: z.enum(['percent', 'amount']).optional().default('percent'),
    wholesalePercent: z
      .union([z.coerce.number().finite().min(1).max(100), z.null()])
      .optional(),
    wholesaleAmount: z
      .union([z.coerce.number().finite().min(0).max(999_999_999_999), z.null()])
      .optional(),
    wholesaleQty: z.string().trim().max(80).optional().default(''),
    inStock: z.boolean().optional(),
    applyProportional: z.boolean().optional().default(false)
  })
  .superRefine((data, ctx) => {
    if (data.hasSitePrice && (data.sitePercent == null || !Number.isFinite(Number(data.sitePercent)))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'درصد تفاوت قیمت سایت الزامی است',
        path: ['sitePercent']
      });
    }
    if (data.hasWholesale) {
      const mode = data.wholesaleMode === 'amount' ? 'amount' : 'percent';
      if (mode === 'percent') {
        if (data.wholesalePercent == null || !Number.isFinite(Number(data.wholesalePercent))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'درصد قیمت عمده الزامی است',
            path: ['wholesalePercent']
          });
        }
      } else if (data.wholesaleAmount == null || !Number.isFinite(Number(data.wholesaleAmount))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'مبلغ تغییر قیمت عمده الزامی است',
          path: ['wholesaleAmount']
        });
      }
    }
  });

export const newPortalProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  variants: z
    .array(
      z.object({
        weight: z.string().trim().max(80).default(''),
        /** قیمت صفر یا علامت نامعتبر هم مجاز است و در اکسل نگه داشته می‌شود */
        price: priceTomanField
      })
    )
    .min(1)
    .max(12)
});

export function auditPriceChange(payload: {
  ip: string;
  productId: string;
  variantId?: string | null;
  price: number;
  via: 'admin' | 'portal';
}) {
  logInfo('price_portal.price_updated', {
    ip: payload.ip.replace(/\d+$/, '****'),
    productId: payload.productId,
    variantId: payload.variantId || null,
    price: payload.price,
    via: payload.via
  });
}

export function auditLoginAttempt(payload: { ip: string; ok: boolean; reason?: string }) {
  const event = payload.ok ? 'price_portal.login.success' : 'price_portal.login.failed';
  const fn = payload.ok ? logInfo : logError;
  fn(event, {
    ip: payload.ip.replace(/\d+$/, '****'),
    reason: payload.reason || null
  });
}
