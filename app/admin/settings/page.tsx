export default function AdminSettingsPage() {
  const sample = `{
  "slides": [
    {
      "title": "عنوان اسلاید",
      "subtitle": "زیرعنوان",
      "image": "https://...",
      "ctaText": "مشاهده",
      "ctaLink": "/products"
    }
  ]
}`;

  return <main className="p-6"><h1 className="text-2xl font-bold">تنظیمات سایت</h1><p className="mt-3">برای مدیریت اسلایدر صفحه اول، JSON زیر را با متد POST به API ارسال کنید:</p><pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">POST /api/admin/settings/slider\n{sample}</pre></main>;
}
