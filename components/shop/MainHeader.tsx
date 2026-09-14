'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Heart, Leaf, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CartBadge } from '@/components/shop/CartBadge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableText } from '@/components/cms/EditableContent';
import { cn } from '@/lib/utils/cn';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'فروشگاه' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/products?discount=1', label: 'پیشنهادها' },
  { href: '/blog', label: 'مجله' },
  { href: '/help', label: 'راهنما' }
];

export const MainHeader = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const { content, patchContent, editMode, isAdmin } = useSiteContent();
  const header = content.header;

  const saveHeader = (field: keyof typeof header, value: string) =>
    patchContent({ header: { ...header, [field]: value } });

  return (
    <header className={cn('sticky top-0 z-50 border-b border-surface-200/70 bg-[#fffef9]/90 shadow-header backdrop-blur-xl', editMode && isAdmin && 'top-9')}>
      {header.announcement ? (
        <div className="organic-grid bg-brand-900 px-4 py-2 text-center text-[11px] font-bold text-brand-50 sm:text-xs">
          <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-accent-400 shadow-[0_0_0_4px_rgba(212,149,90,0.14)]" />
          <EditableText value={header.announcement} onSave={(v) => saveHeader('announcement', v)} label="اعلان هدر" />
        </div>
      ) : isAdmin && editMode ? (
        <div className="border-b border-dashed border-amber-200 bg-amber-50/90 px-4 py-1.5 text-center">
          <button type="button" onClick={() => void saveHeader('announcement', 'ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان')} className="text-xs font-bold text-amber-800">
            + افزودن نوار اعلان
          </button>
        </div>
      ) : null}

      <Container>
        <div className="flex h-[4.5rem] items-center justify-between gap-4 lg:h-20 lg:gap-7">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-brand-800 text-white shadow-lg shadow-brand-900/15 transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <Leaf className="h-5 w-5" />
              <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-[#fffef9] bg-accent-400" />
            </span>
            <div className="leading-tight">
              <EditableText value={header.brandName} onSave={(v) => saveHeader('brandName', v)} className="block text-base font-black tracking-tight text-surface-900" as="span" label="نام برند" />
              <EditableText value={header.brandTagline} onSave={(v) => saveHeader('brandTagline', v)} className="hidden text-[10px] font-medium tracking-wide text-surface-400 sm:block" as="span" label="شعار" />
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && !item.href.includes('?') && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn('relative rounded-xl px-3.5 py-2 text-sm font-bold transition', active ? 'text-brand-800' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900')}>
                  {item.label}
                  {active ? <span className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-accent-500" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mr-auto hidden max-w-[15rem] flex-1 xl:block">
            <form action="/products" className="relative">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input name="q" aria-label="جستجوی محصولات" placeholder="جستجو در محصولات..." className="h-10 w-full rounded-xl border border-surface-200 bg-white/70 pr-10 pl-3 text-xs outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-50" />
            </form>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href={user ? '/dashboard/wishlist' : '/auth/login?next=/dashboard/wishlist'} aria-label="علاقه‌مندی‌ها" className="hidden h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:flex sm:h-11 sm:w-11">
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link href="/cart" aria-label="سبد خرید" className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft sm:h-11 sm:w-11">
              <ShoppingBag className="h-[18px] w-[18px]" />
              <CartBadge />
            </Link>
            <Link href={user ? '/dashboard' : '/auth/login'} className="site-btn-primary !h-10 !rounded-xl !px-3 !py-0 !text-[12px] sm:!h-11 sm:!px-4 sm:!text-[13px]">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{user ? 'حساب من' : 'ورود'}</span>
              <span className="sm:hidden">{user ? 'پنل' : 'ورود'}</span>
            </Link>
          </div>

          <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white lg:hidden" aria-label="منو">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-surface-200 bg-[#fffef9] px-5 py-4 shadow-xl lg:hidden">
          <form action="/products" className="relative mb-3">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input name="q" placeholder="جستجو در فروشگاه..." className="site-input bg-white pr-10" />
          </form>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn('rounded-xl px-3 py-3 text-sm font-bold', pathname === item.href ? 'bg-brand-50 text-brand-800' : 'text-surface-700 hover:bg-surface-100')}>{item.label}</Link>
            ))}
            <Link href={user ? '/dashboard/wishlist' : '/auth/login?next=/dashboard/wishlist'} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-surface-700 hover:bg-rose-50 hover:text-rose-700"><Heart className="h-4 w-4" /> علاقه‌مندی‌ها</Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
};
