import Link from 'next/link';
import { IconCategory, IconShoppingBag, IconUser } from './Icons';
import { getSessionUser } from '@/lib/auth/session';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/blog/identify-original-oil', label: 'بلاگ' },
  { href: '/dashboard', label: 'پنل مشتری' }
];

const ADMIN_ENTRY_ROLES = ['SUPER_ADMIN', 'OPERATOR', 'WAREHOUSE_MANAGER', 'CONTENT_MANAGER'];

export const MainHeader = async () => {
  const session = await getSessionUser();
  const canEnterAdmin = !!session && ADMIN_ENTRY_ROLES.includes(session.role);

  return (
    <header className="sticky top-0 z-50 mb-4 border-b border-amber-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-3 md:px-6">
        <Link href="/" className="font-black text-amber-900">عصاره طبیعت</Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 md:order-2 md:w-auto md:justify-center md:overflow-visible md:pb-0">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="order-2 flex items-center gap-1.5 md:order-3 md:gap-2">
          {canEnterAdmin ? <Link href="/admin" className="rounded-lg bg-slate-900 px-2.5 py-2 text-xs text-white md:px-3 md:text-sm">ورود به پنل</Link> : null}
          <Link href="/categories" className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs md:px-3 md:text-sm"><IconCategory /> منو</Link>
          <Link href="/cart" className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs md:px-3 md:text-sm"><IconShoppingBag /> سبد</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs md:px-3 md:text-sm"><IconUser /> ورود</Link>
          <Link href="/auth/register" className="rounded-lg bg-amber-800 px-2.5 py-2 text-xs text-white md:px-3 md:text-sm">ثبت‌نام</Link>
        </div>
      </div>
    </header>
  );
};
