import Link from 'next/link';
import { IconCategory, IconShoppingBag, IconUser } from './Icons';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/blog/identify-original-oil', label: 'بلاگ' },
  { href: '/dashboard', label: 'پنل مشتری' }
];

export const MainHeader = () => {
  return (
    <header className="sticky top-0 z-50 mb-6 border-b border-amber-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="font-black text-amber-900">عصاره طبیعت</Link>

        <nav className="hidden items-center gap-1 md:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/categories" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><IconCategory /> منو</Link>
          <Link href="/cart" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><IconShoppingBag /> سبد</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><IconUser /> ورود</Link>
          <Link href="/auth/register" className="rounded-lg bg-amber-800 px-3 py-2 text-sm text-white">ثبت‌نام</Link>
        </div>
      </div>
    </header>
  );
};
