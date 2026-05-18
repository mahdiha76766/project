'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconCategory, IconShoppingBag, IconUser } from './Icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const menuItems = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'محصولات' },
  { href: '/categories', label: 'دسته‌بندی‌ها' },
  { href: '/blog/', label: 'بلاگ' }
];

export const MainHeader = () => {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7dcc8] bg-[#fffdf8]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl px-1 py-1">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7d8f5c] to-[#667744] text-sm font-black text-white">ع</span>
          <span className="text-lg font-black tracking-tight text-[#4d382b]">عصاره طبیعت</span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-[#eadfcb] bg-white/80 p-1 lg:flex">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#5f4a3c] transition hover:bg-[#f6efe1] hover:text-[#4d382b]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/cart" className="inline-flex items-center gap-1 rounded-xl border border-[#e2d6c0] bg-white px-3 py-2 text-sm font-medium text-[#5f4a3c] transition hover:bg-[#faf6ed]"><IconShoppingBag /> سبد</Link>
          <Link href={user ? '/dashboard' : '/auth/login'} className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#667744] to-[#7b8b5a] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-105"><IconUser /> {user ? 'پروفایل' : 'ورود / ثبت‌نام'}</Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="rounded-xl border border-[#d8ccb4] bg-white px-3 py-2 text-[#5f4a3c] lg:hidden" aria-label="menu">☰</button>
      </div>

      {open ? (
        <div className="border-t border-[#e8dcc5] bg-[#fffdf8] px-4 py-3 lg:hidden">
          <div className="grid gap-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl border border-[#e1d5bf] bg-white px-3 py-2.5 text-sm font-medium text-[#5f4a3c]" onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-xl border border-[#e1d5bf] bg-white px-3 py-2.5 text-sm text-[#5f4a3c]"><IconCategory /> دسته‌بندی‌ها</Link>
            <Link href="/cart" className="inline-flex items-center gap-2 rounded-xl border border-[#e1d5bf] bg-white px-3 py-2.5 text-sm text-[#5f4a3c]"><IconShoppingBag /> سبد خرید</Link>
            <Link href={user ? '/dashboard' : '/auth/login'} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#667744] to-[#7b8b5a] px-3 py-2.5 text-sm font-bold text-white"><IconUser /> {user ? 'پروفایل کاربری' : 'ورود / ثبت‌نام'}</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
};
