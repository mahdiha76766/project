'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  LayoutDashboard,
  Package,
  Shapes,
  ShoppingCart,
  TicketPercent,
  Truck,
  Users,
  MessageSquare,
  Newspaper,
  Image,
  Settings,
  Server,
  Save,
  X,
  CreditCard,
  BarChart3,
  Banknote,
  Shield,
  Store,
  MessageSquareText
} from 'lucide-react';
import { useState } from 'react';
import { CronInit } from './init/CronInit';

const navItems = [
  { href: '/admin/analytics', label: 'آمار بازدید', icon: BarChart3 },
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/products', label: 'محصولات', icon: Package },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Shapes },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: ShoppingCart },
  { href: '/admin/finance/transactions', label: 'تراکنش‌ها', icon: CreditCard },
  { href: '/admin/finance/stats', label: 'آمار مالی', icon: BarChart3 },
  { href: '/admin/finance/withdrawals', label: 'برداشت‌ها', icon: Banknote },
  { href: '/admin/finance/payments', label: 'پرداخت‌ها', icon: CreditCard },
  { href: '/admin/coupons', label: 'کدهای تخفیف', icon: TicketPercent },
  { href: '/admin/sms', label: 'پیامک SMS', icon: MessageSquareText },
  { href: '/admin/receipts', label: 'رسیدهای پرداخت', icon: CreditCard },
  { href: '/admin/shipping', label: 'روش‌های ارسال', icon: Truck },
  { href: '/admin/users', label: 'کاربران', icon: Users },
  { href: '/admin/reviews', label: 'نظرات', icon: MessageSquare },
  { href: '/admin/blog', label: 'بلاگ', icon: Newspaper },
  { href: '/admin/banners', label: 'بنرها', icon: Image },
  { href: '/admin/slider', label: 'اسلایدر صفحه اصلی', icon: Image },
  { href: '/admin/settings', label: 'سئو و تنظیمات سایت', icon: Settings },
  { href: '/admin/server', label: 'راه‌اندازی سرور', icon: Server },
  { href: '/admin/backups', label: 'بک‌آپ و بازیابی', icon: Save }
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              active
                ? 'bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="mb-5 rounded-2xl bg-gradient-to-l from-slate-800 to-slate-900 p-4 text-white">
        <div className="flex items-center gap-2">
          <Shield size={18} />
          <div>
            <p className="text-sm font-black">پنل مدیریت</p>
            <p className="text-xs text-slate-300">مدیریت فروشگاه و مالی</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
      </div>
      <Link
        href="/"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
      >
        <Store size={18} />
        بازگشت به فروشگاه
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <CronInit />
      <div className="mx-auto grid max-w-[1600px] gap-5 p-4 lg:grid-cols-[270px,1fr]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          {sidebar}
        </aside>
        <div className="min-w-0">
          <header className="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 p-2 lg:hidden" onClick={() => setOpen(true)}>
                <Menu size={18} />
              </button>
              <div>
                <h1 className="font-black text-slate-900">پنل ادمین فروشگاه</h1>
                <p className="text-xs text-slate-500">مدیریت محصولات، سفارش‌ها و امور مالی</p>
              </div>
            </div>
            <button className="rounded-xl border border-slate-200 p-2 text-slate-600">
              <Bell size={18} />
            </button>
          </header>
          <main>{children}</main>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-80 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-sm font-black">منوی ادمین</strong>
              <button onClick={() => setOpen(false)} className="rounded-lg border p-1.5">
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
