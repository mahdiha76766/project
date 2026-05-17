import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/token';
import { hasMinimumRole } from '@/server/permissions';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session_token')?.value;
  const session = token ? verifyToken<{ userId: string; role: any }>(token) : null;

  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/auth/login', req.url));
    if (!hasMinimumRole(session.role, 'ADMIN')) return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
