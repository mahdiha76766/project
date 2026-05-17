'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const mobile = String(form.get('mobile') || '');
    const password = String(form.get('password') || '');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password })
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'ورود ناموفق بود.');
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-90px)] max-w-5xl px-4 py-8 sm:py-12 lg:flex lg:items-center">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#e5dac6] bg-white p-6 shadow-[0_18px_50px_-35px_rgba(90,62,43,0.45)] sm:p-8">
        <p className="text-xs font-semibold text-[#7a6243]">خوش آمدید</p>
        <h1 className="mt-2 text-3xl font-black text-[#4d382b]">ورود به حساب کاربری</h1>
        <p className="mt-2 text-sm text-[#6b5646]">برای پیگیری سفارش‌ها و خرید سریع‌تر وارد حساب خود شوید.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">شماره موبایل</label>
            <input name="mobile" placeholder="09xxxxxxxxx" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">رمز عبور</label>
            <input name="password" type="password" placeholder="••••••••" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#667744] to-[#7b8b5a] p-3 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60">{loading ? 'در حال ورود...' : 'ورود به حساب'}</button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6b5646]">
          حساب ندارید؟ <Link href="/auth/register" className="font-bold text-[#667744]">ثبت‌نام</Link>
        </p>
      </div>
    </main>
  );
}
