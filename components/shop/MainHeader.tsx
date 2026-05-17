'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconCategory, IconShoppingBag, IconUser } from './Icons';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/blog/identify-original-oil', label: 'بلاگ' }
];

export const MainHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 mb-4 border-b border-amber-100/70 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-black text-amber-900">عصاره طبیعت</Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-amber-50">{item.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-500">
            جستجو...
          </div>
          <Link href="/cart" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><IconShoppingBag /> سبد</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><IconUser /> حساب</Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border px-3 py-2 lg:hidden" aria-label="menu">☰</button>
      </div>

      {open ? (
        <div className="border-t bg-white px-4 py-3 lg:hidden">
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-600">جستجو...</div>
          <div className="grid gap-2">
            {menuItems.map((item) => <Link key={item.href} href={item.href} className="rounded-lg border px-3 py-2" onClick={() => setOpen(false)}>{item.label}</Link>)}
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"><IconCategory /> دسته‌بندی‌ها</Link>
            <Link href="/cart" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"><IconShoppingBag /> سبد خرید</Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"><IconUser /> ورود / ثبت‌نام</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};
