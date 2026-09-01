import { NextResponse } from 'next/server';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';
import { canAccessAdminPanel, roleHasCapability, type AdminCapability } from '@/server/permissions';

function forbidden() {
  return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
}

function unauthenticated() {
  return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { error: unauthenticated() };
  return { user };
}

export async function requireCapability(capability: AdminCapability): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) return { error: unauthenticated() };
  if (!roleHasCapability(user.role, capability)) return { error: forbidden() };
  return { user };
}

export async function requirePanel() {
  const user = await getSessionUser();
  if (!user) return { error: unauthenticated() };
  if (!canAccessAdminPanel(user.role)) return { error: forbidden() };
  return { user };
}

/** Full shop/admin operators (ADMIN+). Kept for commerce, users, backups. */
export async function requireAdmin() {
  return requireCapability('commerce');
}

export async function requireContent() {
  return requireCapability('content');
}

export async function requireCatalog() {
  return requireCapability('catalog');
}

export function getIdempotencyKey(req: Request) {
  return req.headers.get('Idempotency-Key') ?? req.headers.get('idempotency-key') ?? undefined;
}

export function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
}
