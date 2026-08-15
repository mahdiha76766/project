import 'server-only';

import { createHash } from 'crypto';

/** Stable visitor fingerprint from IP + User-Agent (server-side). */
export function buildVisitorKey(ip: string, userAgent: string): string {
  const normalized = `${ip.trim()}|${userAgent.trim().slice(0, 500)}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

/** Hashed IP for storage without keeping raw IP. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip.trim()).digest('hex').slice(0, 16);
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/** Session stays active for 30 minutes of inactivity. */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

/** Ignore rapid repeat pageviews within this window (close/reopen, refresh spam). */
export const PAGEVIEW_DEDUP_MS = 3 * 60 * 1000;
