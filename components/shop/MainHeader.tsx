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
    <header className="sticky top-0 z-50 border-b border-[#e8dcc5] bg-[#fffdf8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-black tracking-tight text-[#4d382b]">عصاره طبیعت</Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-[#5f4a3c] transition hover:bg-[#f5efdf]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <div className="rounded-xl border border-[#dfd2bb] bg-white px-3 py-2 text-sm text-[#8b7766]">جستجو در محصولات...</div>
          <Link href="/cart" className="inline-flex items-center gap-1 rounded-lg border border-[#dfd2bb] bg-white px-3 py-2 text-sm text-[#5f4a3c]"><IconShoppingBag /> سبد</Link>
          <Link href="/auth/login" className="inline-flex items-center gap-1 rounded-lg bg-[#667744] px-3 py-2 text-sm text-white"><IconUser /> حساب</Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="rounded-lg border border-[#d8ccb4] bg-white px-3 py-2 text-[#5f4a3c] lg:hidden" aria-label="menu">☰</button>
      </div>

      {open ? (
        <div className="border-t border-[#e8dcc5] bg-[#fffdf8] px-4 py-3 lg:hidden">
          <div className="mb-3 rounded-xl border border-[#dfd2bb] bg-white px-3 py-2 text-sm text-[#8b7766]">جستجو در محصولات...</div>
          <div className="grid gap-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-[#e1d5bf] bg-white px-3 py-2 text-sm text-[#5f4a3c]" onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-lg border border-[#e1d5bf] bg-white px-3 py-2 text-sm text-[#5f4a3c]"><IconCategory /> دسته‌بندی‌ها</Link>
            <Link href="/cart" className="inline-flex items-center gap-2 rounded-lg border border-[#e1d5bf] bg-white px-3 py-2 text-sm text-[#5f4a3c]"><IconShoppingBag /> سبد خرید</Link>
            <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-lg bg-[#667744] px-3 py-2 text-sm text-white"><IconUser /> ورود / ثبت‌نام</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};
