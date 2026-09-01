/** Paths that must never be indexed by search engines. */
const PRIVATE_PREFIXES = [
  '/dashboard',
  '/auth',
  '/admin',
  '/profile',
  '/cart',
  '/checkout',
  '/orders',
  '/unauthorized'
] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const PRIVATE_ROBOTS_HEADER = 'noindex, nofollow';
