'use client';

import { useState } from 'react';

const initial = {
  slides: [
    { title: 'عنوان اسلاید', subtitle: 'زیرعنوان اسلاید', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', ctaText: 'مشاهده', ctaLink: '/products' }
  ]
};

export default function AdminSettingsPage() {
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [message, setMessage] = useState('');

  const save = async () => {
    setMessage('در حال ذخیره...');
    try {
      const parsed = JSON.parse(json);
      const res = await fetch('/api/admin/settings/slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      setMessage(res.ok ? 'اسلایدر با موفقیت ذخیره شد. تغییرات روی سایت اعمال می‌شود.' : 'ذخیره ناموفق بود.');
    } catch {
      setMessage('فرمت JSON نامعتبر است.');
    }
  };

  return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-black text-[#4d382b]">تنظیمات اسلایدر صفحه اصلی</h1><p className="mt-2 text-sm text-slate-600">اسلایدها را از همین پنل تغییر دهید. بعد از ذخیره، صفحه اصلی به‌صورت خودکار از تنظیمات جدید استفاده می‌کند.</p><textarea value={json} onChange={(e) => setJson(e.target.value)} className="mt-4 h-80 w-full rounded-2xl border border-amber-200 bg-white p-4 font-mono text-xs" /><button onClick={save} className="mt-4 rounded-xl bg-[#667744] px-5 py-2.5 font-bold text-white">ذخیره اسلایدر</button><p className="mt-3 text-sm text-[#5a3e2b]">{message}</p></main>;
}
