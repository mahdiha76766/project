'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Download,
  FileText,
  Home,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  Settings,
  Shapes,
  UserRound,
  Users,
  X,
  ChevronDown,
  Store
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CronInit } from './init/CronInit';
import { AdminToastProvider } from '@/components/admin/AdminToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  canManageCatalog,
  canManageCommerce,
  canManageUsers,
  isAdminPanelRole,
  roleLabelFa
} from '@/lib/auth/client-roles';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

type NavItem = { href: string; label: string; icon: typeof Home; show?: boolean };

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: '/admin/products', title: 'محصولات' },
  { prefix: '/admin/categories', title: 'دسته‌بندی محصولات' },
  { prefix: '/admin/blog', title: 'مقالات' },
  { prefix: '/admin/downloads', title: 'دانلودها' },
  { prefix: '/admin/media', title: 'رسانه' },
  { prefix: '/admin/homepage', title: 'صفحه اصلی' },
  { prefix: '/admin/about', title: 'درباره ما' },
  { prefix: '/admin/contact', title: 'اطلاعات تماس' },
  { prefix: '/admin/messages', title: 'پیام‌ها' },
  { prefix: '/admin/users', title: 'کاربران' },
  { prefix: '/admin/settings/sales', title: 'تنظیمات فروش' },
  { prefix: '/admin/settings', title: 'تنظیمات' },
  { prefix: '/admin/analytics', title: 'آمار بازدید' },
  { prefix: '/admin/price_product', title: 'پورتال قیمت' },
  { prefix: '/admin/orders', title: 'سفارش‌ها' },
  { prefix: '/admin/finance', title: 'مالی' },
  { prefix: '/admin/coupons', title: 'کدهای تخفیف' },
  { prefix: '/admin/sms', title: 'پیامک' },
  { prefix: '/admin/receipts', title: 'رسیدها' },
  { prefix: '/admin/shipping', title: 'ارسال' },
  { prefix: '/admin/reviews', title: 'نظرات' },
  { prefix: '/admin/banners', title: 'بنرها' },
  { prefix: '/admin/slider', title: 'اسلایدر' },
  { prefix: '/admin/server', title: 'سرور' },
  { prefix: '/admin/backups', title: 'بک‌آپ' },
  { prefix: '/admin', title: 'داشبورد' }
];

function pageTitle(pathname: string) {
  return PAGE_TITLES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))?.title || 'پنل مدیریت';
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const visible = items.filter((item) => item.show !== false);
  if (!visible.length) return null;
  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[11px] font-bold tracking-wide text-gold-200">{title}</p>
      <nav className="space-y-1">
        {visible.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                active ? 'bg-paper-50 text-ink-900 shadow-sm' : 'text-paper-50 hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const catalog = !user || canManageCatalog(user.role);
  const commerce = !user || canManageCommerce(user.role);
  const users = !user || canManageUsers(user.role);

  useEffect(() => {
    if (user && !isAdminPanelRole(user.role)) {
      router.replace('/unauthorized');
    }
  }, [user, router]);

  useEffect(() => {
    let active = true;
    void fetch('/api/admin/overview', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setUnread(Number(data?.overview?.unreadMessages || 0));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [pathname]);

  const mainNav: NavItem[] = useMemo(
    () => [
      { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
      { href: '/admin/products', label: 'محصولات', icon: Package, show: catalog },
      { href: '/admin/categories', label: 'دسته‌بندی محصولات', icon: Shapes, show: catalog },
      { href: '/admin/blog', label: 'مقالات', icon: Newspaper },
      { href: '/admin/downloads', label: 'دانلودها', icon: Download },
      { href: '/admin/media', label: 'رسانه', icon: ImageIcon },
      { href: '/admin/homepage', label: 'صفحه اصلی', icon: Home },
      { href: '/admin/about', label: 'درباره ما', icon: Info },
      { href: '/admin/contact', label: 'اطلاعات تماس', icon: BookOpen },
      { href: '/admin/messages', label: 'پیام‌ها', icon: Mail },
      { href: '/admin/users', label: 'کاربران', icon: Users, show: users },
      { href: '/admin/settings', label: 'تنظیمات سایت', icon: Settings, show: commerce },
      { href: '/admin/settings/sales', label: 'تنظیمات فروش', icon: Store, show: commerce }
    ],
    [catalog, commerce, users]
  );

  const opsNav: NavItem[] = useMemo(
    () => [
      { href: '/admin/orders', label: 'سفارش‌ها', icon: Store, show: commerce },
      { href: '/admin/analytics', label: 'آمار بازدید', icon: LayoutDashboard, show: commerce },
      { href: '/admin/price_product', label: 'پورتال قیمت', icon: Package, show: commerce },
      { href: '/admin/reviews', label: 'نظرات', icon: MessageSquare, show: commerce },
      { href: '/admin/banners', label: 'بنرها', icon: ImageIcon, show: commerce },
      { href: '/admin/slider', label: 'اسلایدر', icon: ImageIcon, show: commerce },
      { href: '/admin/backups', label: 'بک‌آپ', icon: FileText, show: commerce }
    ],
    [commerce]
  );

  async function logout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth/login';
  }

  const sidebar = (
    <div className="flex h-full flex-col text-white">
      <div className="mb-6 px-2">
        <p className="text-xs text-gold-200">{FEEDAR_BRAND.nameEn}</p>
        <p className="mt-1 text-lg font-black">پنل مدیریت</p>
      </div>
      <div className="flex-1 overflow-y-auto pe-1">
        <NavGroup title="محتوا و سایت" items={mainNav} pathname={pathname} onNavigate={() => setOpen(false)} />
        {commerce ? (
          <div>
            <button
              type="button"
              onClick={() => setOpsOpen((v) => !v)}
              className="mb-2 flex w-full items-center justify-between px-3 text-[11px] font-bold tracking-wide text-gold-200"
            >
              عملیات فروشگاه
              <ChevronDown size={14} className={opsOpen ? 'rotate-180' : ''} />
            </button>
            {opsOpen ? <NavGroup title="" items={opsNav} pathname={pathname} onNavigate={() => setOpen(false)} /> : null}
          </div>
        ) : null}
      </div>
      <Link
        href="/"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-bold text-white hover:bg-white/10"
      >
        مشاهده سایت
      </Link>
    </div>
  );

  return (
    <AdminToastProvider>
      <div className="min-h-screen bg-paper-100 text-ink-900">
        <CronInit />
        <div className="mx-auto grid max-w-[1600px] gap-5 p-4 lg:grid-cols-[270px,1fr]">
          <aside className="hidden overflow-y-auto rounded-[1.75rem] bg-ink-900 p-5 shadow-card lg:sticky lg:top-4 lg:block lg:h-[calc(100vh-2rem)]">
            {sidebar}
          </aside>
          <div className="min-w-0">
            <header className="sticky top-0 z-30 mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-paper-200 bg-paper-50/95 p-4 shadow-soft backdrop-blur">
              <div className="flex min-w-0 items-center gap-2">
                <button type="button" className="rounded-xl border border-surface-200 p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="منو">
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate font-black text-surface-900">{pageTitle(pathname)}</h1>
                  <p className="text-xs text-surface-500">فیدار فارمد — مدیریت محتوا و محصولات</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/messages" className="relative rounded-xl border border-surface-200 p-2 text-surface-600" aria-label="اعلان‌ها">
                  <Bell size={18} />
                  {unread > 0 ? (
                    <span className="absolute -top-1 -start-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">
                      {unread.toLocaleString('fa-IR')}
                    </span>
                  ) : null}
                </Link>
                <div className="hidden items-center gap-2 rounded-xl border border-surface-200 px-3 py-1.5 sm:flex">
                  <UserRound size={16} className="text-brand-800" />
                  <div className="leading-tight">
                    <p className="text-xs font-bold" dir="ltr">
                      {user?.mobile || '—'}
                    </p>
                    <p className="text-[11px] text-surface-500">{roleLabelFa(user?.role)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-1 rounded-xl border border-surface-200 px-3 py-2 text-sm font-bold text-surface-700 hover:bg-surface-50"
                >
                  <LogOut size={16} />
                  خروج
                </button>
              </div>
            </header>
            <main className="min-w-0 space-y-6">{children}</main>
          </div>
        </div>
        {open ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="absolute inset-y-0 start-0 h-full w-80 max-w-[88vw] bg-ink-900 p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between text-white">
                <strong className="text-sm font-black">منوی مدیریت</strong>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/20 p-1.5" aria-label="بستن">
                  <X size={18} />
                </button>
              </div>
              {sidebar}
            </aside>
          </div>
        ) : null}
      </div>
    </AdminToastProvider>
  );
}
