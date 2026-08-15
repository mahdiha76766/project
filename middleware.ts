import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/token';
import { hasMinimumRole } from '@/server/permissions';
import { isPrivatePath, PRIVATE_ROBOTS_HEADER } from '@/lib/seo/private-routes';

function redirectToCanonicalOrigin(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const host = (req.headers.get('host') || '').toLowerCase();
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0]?.trim();
  const needsHttps = proto === 'http';
  const needsWwwStrip = host.startsWith('www.');

  if (!needsHttps && !needsWwwStrip) return null;

  const url = req.nextUrl.clone();
  url.protocol = 'https:';
  if (needsWwwStrip) {
    url.host = host.replace(/^www\./, '');
  }

  return NextResponse.redirect(url, 301);
}

function withPrivateRobots(res: NextResponse) {
  res.headers.set('X-Robots-Tag', PRIVATE_ROBOTS_HEADER);
  return res;
}

export async function middleware(req: NextRequest) {
  const canonicalRedirect = redirectToCanonicalOrigin(req);
  if (canonicalRedirect) return canonicalRedirect;

  const { pathname } = req.nextUrl;
  const isPrivate = isPrivatePath(pathname);

  const token = req.cookies.get('session_token')?.value;
  const session = token ? await verifyToken<{ userId: string; role: any }>(token) : null;

  if (pathname.startsWith('/dashboard') && !session) {
    return withPrivateRobots(NextResponse.redirect(new URL('/auth/login', req.url)));
  }

  if (pathname.startsWith('/admin')) {
    if (!session) {
      return withPrivateRobots(NextResponse.redirect(new URL('/auth/login', req.url)));
    }
    if (!hasMinimumRole(session.role, 'ADMIN')) {
      return withPrivateRobots(NextResponse.redirect(new URL('/', req.url)));
    }
  }

  if (isPrivate) {
    return withPrivateRobots(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)'
  ]
};
