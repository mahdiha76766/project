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
  LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useSalesConfig } from '@/components/commerce/SalesProvider';
import { FpLogo } from '@/components/feedar/ui/Logo';

const allNav = [
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
  { href: '/dashboard/coupons', label: 'کدهای تخفیف', icon: TicketPercent, commerce: true },
  { href: '/dashboard/returns', label: 'مرجوعی', icon: RotateCcw, commerce: true }
];

function NavLinks({
  pathname,
  salesEnabled,
  onNavigate
}: {
  pathname: string;
  salesEnabled: boolean;
  onNavigate?: () => void;
}) {
  const items = allNav.filter((item) => !item.commerce || salesEnabled);
  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
              active ? 'bg-ink-900 text-paper-50' : 'text-ink-800 hover:bg-paper-100'
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
  const { salesEnabled } = useSalesConfig();
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
      <div className="mb-5">
        <FpLogo />
        <p className="mt-3 text-xs text-surface-500">پنل کاربری</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks pathname={pathname} salesEnabled={salesEnabled} onNavigate={() => setOpen(false)} />
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-paper-200 px-3 py-2.5 text-sm font-bold text-ink-800"
      >
        <LogOut size={18} />
        {loggingOut ? 'در حال خروج...' : 'خروج از حساب'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-100">
      <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[270px,1fr]">
        <aside className="hidden rounded-[1.75rem] border border-paper-200 bg-paper-50 p-4 shadow-soft lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
          {sidebar}
        </aside>
        <section>
          <header className="mb-4 flex items-center justify-between rounded-[1.5rem] border border-paper-200 bg-paper-50 p-4 shadow-soft">
            <div>
              <h1 className="font-black text-ink-900">پنل کاربری</h1>
              <p className="text-xs text-surface-500">مدیریت حساب و سوابق</p>
            </div>
            <button onClick={() => setOpen(true)} className="rounded-full border border-paper-200 p-2 lg:hidden" type="button">
              <Menu size={18} />
            </button>
          </header>
          {children}
        </section>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="absolute inset-y-0 start-0 h-full w-80 max-w-[88vw] bg-paper-50 p-4" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setOpen(false)} className="mb-4 rounded-full border border-paper-200 p-2" aria-label="بستن">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
