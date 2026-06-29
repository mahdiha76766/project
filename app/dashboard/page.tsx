'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Receipt,
  ShoppingBag,
  MapPin,
  User2,
  Lock,
  Heart,
  MessageSquare,
  TicketPercent,
  RotateCcw,
  ArrowLeft,
  Package,
  Clock3
} from 'lucide-react';
import { DashPageHeader, DashStatCard, DashLoading } from '@/components/shop/DashboardUI';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDashCurrency } from '@/lib/dashboard/formats';

const quickLinks = [
  { title: 'کیف پول', href: '/dashboard/wallet', icon: Wallet, desc: 'شارژ و مدیریت موجودی', color: 'bg-amber-100 text-amber-700' },
  { title: 'تراکنش‌ها', href: '/dashboard/transactions', icon: CreditCard, desc: 'تاریخچه مالی', color: 'bg-sky-100 text-sky-700' },
  { title: 'فاکتورها', href: '/dashboard/invoices', icon: Receipt, desc: 'پیش‌فاکتور و پرداخت', color: 'bg-violet-100 text-violet-700' },
  { title: 'سفارش‌ها', href: '/dashboard/orders', icon: ShoppingBag, desc: 'پیگیری خریدها', color: 'bg-emerald-100 text-emerald-700' },
  { title: 'آدرس‌ها', href: '/dashboard/addresses', icon: MapPin, desc: 'مدیریت آدرس ارسال', color: 'bg-rose-100 text-rose-700' },
  { title: 'پروفایل', href: '/dashboard/profile', icon: User2, desc: 'ویرایش اطلاعات', color: 'bg-indigo-100 text-indigo-700' },
  { title: 'رمز عبور', href: '/dashboard/password', icon: Lock, desc: 'تغییر رمز ورود', color: 'bg-slate-100 text-slate-700' },
  { title: 'علاقه‌مندی‌ها', href: '/dashboard/wishlist', icon: Heart, desc: 'محصولات ذخیره‌شده', color: 'bg-pink-100 text-pink-700' },
  { title: 'نظرات من', href: '/dashboard/reviews', icon: MessageSquare, desc: 'دیدگاه‌های ثبت‌شده', color: 'bg-cyan-100 text-cyan-700' },
  { title: 'کدهای تخفیف', href: '/dashboard/coupons', icon: TicketPercent, desc: 'کوپن‌های فعال', color: 'bg-lime-100 text-lime-700' },
  { title: 'مرجوعی', href: '/dashboard/returns', icon: RotateCcw, desc: 'درخواست بازگشت کالا', color: 'bg-orange-100 text-orange-700' }
] as const;

export default function DashboardPage() {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    walletBalance: 0,
    blockedBalance: 0,
    ordersCount: 0,
    pendingInvoices: 0
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [walletRes, ordersRes, invoicesRes] = await Promise.all([
          fetch('/api/wallet'),
          fetch('/api/dashboard/orders'),
          fetch('/api/invoices/my')
        ]);
        const walletData = walletRes.ok ? await walletRes.json() : null;
        const ordersData = ordersRes.ok ? await ordersRes.json() : null;
        const invoicesData = invoicesRes.ok ? await invoicesRes.json() : null;
        setStats({
          walletBalance: walletData?.wallet?.availableBalance ?? 0,
          blockedBalance: walletData?.wallet?.blockedBalance ?? 0,
          ordersCount: ordersData?.items?.length ?? 0,
          pendingInvoices: (invoicesData?.invoices ?? []).filter((i: { status: string }) => i.status === 'pending').length
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const displayName = user?.mobile || 'کاربر عزیز';

  return (
    <div  >
      <DashPageHeader
        title={`سلام ${displayName} 👋`}
        subtitle="از اینجا می‌توانید سفارش‌ها، کیف پول، فاکتورها و حساب کاربری خود را مدیریت کنید."
      />

      {loading ? (
        <DashLoading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashStatCard
            title="موجودی کیف پول"
            value={formatDashCurrency(stats.walletBalance)}
            hint={stats.blockedBalance > 0 ? `بلوکه: ${formatDashCurrency(stats.blockedBalance)}` : undefined}
            icon={Wallet}
            href="/dashboard/wallet"
            accent="amber"
          />
          <DashStatCard
            title="تعداد سفارش‌ها"
            value={`${stats.ordersCount.toLocaleString('fa-IR')} سفارش`}
            icon={Package}
            href="/dashboard/orders"
            accent="emerald"
          />
          <DashStatCard
            title="فاکتور در انتظار"
            value={`${stats.pendingInvoices.toLocaleString('fa-IR')} مورد`}
            icon={Clock3}
            href="/dashboard/invoices"
            accent="violet"
          />
          <DashStatCard
            title="نمای کلی حساب"
            value="مدیریت سریع"
            hint="دسترسی به همه بخش‌ها"
            icon={LayoutDashboard}
            accent="sky"
          />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800">دسترسی سریع</h2>
          <span className="text-xs text-slate-500">همه امکانات پنل کاربری</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(({ title, href, icon: Icon, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-900">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{desc}</p>
                </div>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}>
                  <Icon size={20} />
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700 opacity-0 transition group-hover:opacity-100">
                ورود به بخش
                <ArrowLeft size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
