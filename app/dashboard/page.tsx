'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const dashboardItems = [
  ['سفارش‌های من', '/dashboard/orders', 'پیگیری وضعیت سفارش‌ها و مشاهده جزئیات خریدهای قبلی.'],
  ['مدیریت آدرس‌ها', '/dashboard/addresses', 'ثبت، ویرایش و انتخاب آدرس‌های ارسال سفارش.'],
  ['ویرایش پروفایل', '/dashboard/profile', 'به‌روزرسانی اطلاعات حساب کاربری و شماره تماس.'],
  ['تغییر رمز عبور', '/dashboard/password', 'افزایش امنیت حساب با تغییر منظم رمز عبور.'],
  ['علاقه‌مندی‌ها', '/dashboard/wishlist', 'مدیریت لیست محصولات ذخیره‌شده برای خرید بعدی.'],
  ['نظرات من', '/dashboard/reviews', 'مشاهده و مدیریت بازخوردهایی که ثبت کرده‌اید.'],
  ['کدهای تخفیف من', '/dashboard/coupons', 'لیست کدهای تخفیف و اعتبار باقیمانده آن‌ها.'],
  ['درخواست مرجوعی', '/dashboard/returns', 'ثبت و پیگیری درخواست مرجوعی سفارش‌ها.']
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLogout = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-amber-900">پنل کاربری</h1>
          <p className="mt-1 text-sm text-amber-800/80">از اینجا می‌توانید آدرس‌ها، سفارش‌ها و اطلاعات حساب خود را مدیریت کنید.</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl border border-amber-200 px-4 py-2 text-sm font-bold text-amber-900 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'در حال خروج...' : 'خروج از حساب'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {dashboardItems.map(([title, href, description]) => (
          <Link key={href} href={href} className="rounded-xl border border-amber-100 bg-white p-4 transition hover:border-amber-300 hover:shadow-sm">
            <h2 className="text-base font-bold text-amber-900">{title}</h2>
            <p className="mt-2 text-sm text-amber-900/70">{description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
