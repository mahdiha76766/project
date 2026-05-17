import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-black text-amber-900">داشبورد مشتری</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ['سفارش‌های من', '/dashboard/orders'],
          ['مدیریت آدرس‌ها', '/dashboard/addresses'],
          ['ویرایش پروفایل', '/dashboard/profile'],
          ['تغییر رمز عبور', '/dashboard/password'],
          ['علاقه‌مندی‌ها', '/dashboard/wishlist'],
          ['نظرات من', '/dashboard/reviews'],
          ['کدهای تخفیف من', '/dashboard/coupons'],
          ['درخواست مرجوعی', '/dashboard/returns']
        ].map(([t, href]) => (
          <Link key={href} href={href} className="rounded-xl border border-amber-100 bg-white p-4">{t}</Link>
        ))}
      </div>
    </main>
  );
}
