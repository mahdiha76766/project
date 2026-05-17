import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ module: 'products', ok: true });
}
