'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, MapPin, ShoppingBag, User2, Lock, Heart, MessageSquare, TicketPercent, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { href: '/dashboard/addresses', label: 'آدرس‌ها', icon: MapPin },
  { href: '/dashboard/profile', label: 'پروفایل', icon: User2 },
  { href: '/dashboard/password', label: 'رمز عبور', icon: Lock },
  { href: '/dashboard/wishlist', label: 'علاقه‌مندی‌ها', icon: Heart },
  { href: '/dashboard/reviews', label: 'نظرات من', icon: MessageSquare },
  { href: '/dashboard/coupons', label: 'کدهای تخفیف', icon: TicketPercent },
  { href: '/dashboard/returns', label: 'مرجوعی', icon: RotateCcw }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = nav.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} onClick={() => setOpen(false)} className={`mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${pathname === href ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-100'}`}><Icon size={16} />{label}</Link>
  ));

  return <div className='min-h-screen bg-slate-50'><div className='mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[260px,1fr]'>
    <aside className='hidden rounded-2xl border bg-white p-3 lg:block'>{links}</aside>
    <section>
      <header className='mb-4 flex items-center justify-between rounded-2xl border bg-white p-3'><div><h1 className='font-black text-slate-900'>پنل کاربری</h1><p className='text-xs text-slate-500'>مدیریت سفارش‌ها، آدرس‌ها و حساب</p></div><button onClick={() => setOpen(true)} className='rounded-lg border p-2 lg:hidden'><Menu size={18} /></button></header>
      {children}
    </section>
  </div>
  {open ? <div className='fixed inset-0 z-50 bg-black/40 lg:hidden' onClick={() => setOpen(false)}><div className='h-full w-72 bg-white p-3' onClick={(e) => e.stopPropagation()}><div className='mb-3 flex items-center justify-between'><strong>منوی داشبورد</strong><button onClick={() => setOpen(false)}><X size={18} /></button></div>{links}</div></div> : null}
  </div>;
}
