'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DashCard } from '@/components/shop/DashboardUI';

const dashboardItems = [
  ['سفارش‌های من', '/dashboard/orders'],
  ['مدیریت آدرس‌ها', '/dashboard/addresses'],
  ['ویرایش پروفایل', '/dashboard/profile'],
  ['تغییر رمز عبور', '/dashboard/password'],
  ['علاقه‌مندی‌ها', '/dashboard/wishlist'],
  ['نظرات من', '/dashboard/reviews'],
  ['کدهای تخفیف من', '/dashboard/coupons'],
  ['درخواست مرجوعی', '/dashboard/returns']
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

  return <div className='space-y-4'>
    <DashCard title='خروج از حساب'>
      <button type='button' onClick={onLogout} disabled={isSubmitting} className='rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-60'>{isSubmitting ? 'در حال خروج...' : 'خروج از حساب'}</button>
    </DashCard>
    <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>{dashboardItems.map(([title, href]) => <Link key={href} href={href} className='rounded-xl border bg-white p-4 text-sm font-bold text-slate-800 transition hover:shadow-sm'>{title}</Link>)}</div>
  </div>;
}
