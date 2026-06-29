import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 }) };
  return { user };
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!hasMinimumRole(user.role, 'ADMIN')) {
    return { error: NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 }) };
  }
  return { user };
}

export function getIdempotencyKey(req: Request) {
  return req.headers.get('Idempotency-Key') ?? req.headers.get('idempotency-key') ?? undefined;
}

export function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
}
