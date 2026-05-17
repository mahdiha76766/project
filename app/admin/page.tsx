import Link from 'next/link';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatCard } from '@/components/admin/StatCard';
import { adminStats, latestPayments, latestUsers, lowStockProducts, topProducts } from '@/lib/admin/mock-data';

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-black text-amber-900">پنل مدیریتی فروشگاه</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard title="فروش امروز" value={`${adminStats.todaySales.toLocaleString('fa-IR')} تومان`} />
        <StatCard title="فروش ماه" value={`${adminStats.monthSales.toLocaleString('fa-IR')} تومان`} />
        <StatCard title="سفارش‌های جدید" value={String(adminStats.newOrders)} />
        <StatCard title="در انتظار ارسال" value={String(adminStats.pendingShipment)} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SectionCard title="محصولات کم‌موجودی"><ul>{lowStockProducts.map((p) => <li key={p.name}>{p.name} - {p.stock}</li>)}</ul></SectionCard>
        <SectionCard title="محصولات پرفروش"><ul>{topProducts.map((p) => <li key={p.name}>{p.name} - {p.sold}</li>)}</ul></SectionCard>
        <SectionCard title="آخرین پرداخت‌ها"><ul>{latestPayments.map((p) => <li key={p.id}>{p.id} - {p.amount.toLocaleString('fa-IR')}</li>)}</ul></SectionCard>
        <SectionCard title="آخرین کاربران"><ul>{latestUsers.map((u) => <li key={u.mobile}>{u.name} - {u.mobile}</li>)}</ul></SectionCard>
      </div>

      <SectionCard title="نمودار فروش">
        <div className="h-48 rounded-xl bg-amber-50 p-4">نمودار فروش (placeholder)</div>
      </SectionCard>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        {[
          ['مدیریت محصولات', '/admin/products'],
          ['مدیریت دسته‌بندی‌ها', '/admin/categories'],
          ['مدیریت سفارش‌ها', '/admin/orders'],
          ['مدیریت کد تخفیف', '/admin/coupons'],
          ['مدیریت ارسال', '/admin/shipping'],
          ['مدیریت کاربران', '/admin/users'],
          ['مدیریت بلاگ', '/admin/blog'],
          ['تنظیمات سایت', '/admin/settings']
        ].map(([t, href]) => <Link key={href} href={href} className="rounded-xl border bg-white p-4">{t}</Link>)}
      </div>
    </main>
  );
}
