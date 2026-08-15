import 'server-only';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getPricePortalSettings } from '@/lib/admin/price-portal-settings';
import { getSessionUser } from '@/lib/auth/session';
import { signToken, verifyToken } from '@/lib/auth/token';
import { hasMinimumRole } from '@/server/permissions';

export const PRICE_PORTAL_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Host-price_portal' : 'price_portal_token';

const PORTAL_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

type PortalTokenPayload = {
  type?: string;
  exp?: number;
  v?: number;
  jti?: string;
};

export async function verifyPricePortalAccess() {
  const admin = await getSessionUser();
  if (admin && hasMinimumRole(admin.role, 'ADMIN')) {
    return { ok: true as const, via: 'admin' as const };
  }

  const jar = await cookies();
  const token = jar.get(PRICE_PORTAL_COOKIE)?.value;
  if (!token) return { ok: false as const };

  const payload = await verifyToken<PortalTokenPayload>(token);
  if (!payload || payload.type !== 'price_portal' || payload.v !== 1) return { ok: false as const };
  if (payload.exp && Number(payload.exp) < Date.now()) return { ok: false as const };

  return { ok: true as const, via: 'portal' as const };
}

export async function loginPricePortal(password: string) {
  const settings = await getPricePortalSettings();
  if (!settings.enabled || !settings.passwordHash) {
    return { ok: false as const, error: 'پورتال قیمت فعال نیست.' };
  }

  if (password.length > 128) {
    return { ok: false as const, error: 'رمز عبور اشتباه است.' };
  }

  const match = await bcrypt.compare(password, settings.passwordHash);
  if (!match) return { ok: false as const, error: 'رمز عبور اشتباه است.' };

  const token = await signToken({
    type: 'price_portal',
    v: 1,
    jti: crypto.randomUUID(),
    exp: Date.now() + PORTAL_TOKEN_TTL_MS
  });

  const jar = await cookies();
  jar.set(PRICE_PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(PORTAL_TOKEN_TTL_MS / 1000)
  });

  return { ok: true as const };
}

export async function logoutPricePortal() {
  const jar = await cookies();
  jar.delete(PRICE_PORTAL_COOKIE);
}
