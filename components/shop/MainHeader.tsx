'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, ShoppingCart, User, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CartBadge } from '@/components/shop/CartBadge';
import { CommerceOnly } from '@/components/commerce/SalesProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableText } from '@/components/cms/EditableContent';
import { cn } from '@/lib/utils/cn';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/blog', label: 'مجله' },
  { href: '/contact', label: 'تماس با ما' }
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
    <header className={cn('sticky top-0 z-50 border-b border-surface-200/80 bg-surface-0/90 shadow-header backdrop-blur-md', editMode && isAdmin && 'top-9')}>
      {header.announcement ? (
        <div className="border-b border-brand-100 bg-gradient-to-l from-brand-50 to-amber-50 px-4 py-2 text-center text-xs font-bold text-brand-800">
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
        <div className="flex h-16 items-center justify-between gap-6 lg:h-[4.25rem]">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition group-hover:scale-105">
              ع
            </span>
            <div className="leading-tight">
              <EditableText value={header.brandName} onSave={(v) => saveHeader('brandName', v)} className="block text-[15px] font-black text-surface-900" as="span" label="نام برند" />
              <EditableText value={header.brandTagline} onSave={(v) => saveHeader('brandTagline', v)} className="hidden text-[11px] text-surface-400 sm:block" as="span" label="شعار" />
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {menuItems.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn('rounded-xl px-3.5 py-2 text-sm font-semibold transition', active ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-100')}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <CommerceOnly>
            <Link href="/cart" aria-label="سبد" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-100 bg-brand-50/50 text-brand-700 transition hover:border-brand-200 hover:bg-brand-50 sm:h-10 sm:w-10">
              <ShoppingCart className="h-[18px] w-[18px]" />
              <CartBadge />
            </Link>
            </CommerceOnly>
            <Link href={user ? '/dashboard' : '/auth/login'} className="site-btn-primary !rounded-xl !px-3 !py-2 !text-[12px] !shadow-md sm:!px-4 sm:!py-2.5 sm:!text-[13px]">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{user ? 'حساب من' : 'ورود'}</span>
              <span className="xs:hidden">{user ? 'پنل' : 'ورود'}</span>
            </Link>
          </div>

          <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 lg:hidden" aria-label="منو">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-surface-200 bg-surface-0 px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-medium text-surface-700 hover:bg-surface-100">{item.label}</Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
};
