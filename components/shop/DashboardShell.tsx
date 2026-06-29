'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  User2,
  Lock,
  Heart,
  MessageSquare,
  TicketPercent,
  RotateCcw,
  Wallet,
  Receipt,
  CreditCard,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/dashboard/wallet', label: 'کیف پول', icon: Wallet },
  { href: '/dashboard/transactions', label: 'تراکنش‌ها', icon: CreditCard },
  { href: '/dashboard/invoices', label: 'فاکتورها', icon: Receipt },
  { href: '/dashboard/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { href: '/dashboard/addresses', label: 'آدرس‌ها', icon: MapPin },
  { href: '/dashboard/profile', label: 'پروفایل', icon: User2 },
  { href: '/dashboard/password', label: 'رمز عبور', icon: Lock },
  { href: '/dashboard/wishlist', label: 'علاقه‌مندی‌ها', icon: Heart },
  { href: '/dashboard/reviews', label: 'نظرات من', icon: MessageSquare },
  { href: '/dashboard/coupons', label: 'کدهای تخفیف', icon: TicketPercent },
  { href: '/dashboard/returns', label: 'مرجوعی', icon: RotateCcw }
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="mb-5 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <div>
            <p className="text-sm font-black">پنل کاربری</p>
            <p className="text-xs text-amber-100">مدیریت حساب و سفارش‌ها</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
      >
        <LogOut size={18} />
        {loggingOut ? 'در حال خروج...' : 'خروج از حساب'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[270px,1fr]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          {sidebar}
        </aside>
        <section>
          <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h1 className="font-black text-slate-900">پنل کاربری</h1>
              <p className="text-xs text-slate-500">مدیریت سفارش‌ها، کیف پول و حساب کاربری</p>
            </div>
            <button onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden">
              <Menu size={18} />
            </button>
          </header>
          {children}
        </section>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-80 bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-sm font-black">منوی داشبورد</strong>
              <button onClick={() => setOpen(false)} className="rounded-lg border p-1.5">
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  );
}
