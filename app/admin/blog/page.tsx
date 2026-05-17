'use client';

import { useEffect, useState } from 'react';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { FieldLabel, TextArea, TextInput } from '@/components/admin/ui/AdminField';
import { AdminTable } from '@/components/admin/ui/AdminTable';

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string;
};

const initialForm = { id: '', title: '', slug: '', excerpt: '', coverImage: '', content: '', isPublished: true };

export default function AdminBlogPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/blog');
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    setMessage('در حال ذخیره...');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/blog/${form.id}` : '/api/admin/blog';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) {
      setMessage('خطا در ذخیره مقاله. عنوان/محتوا/تصویر را بررسی کنید.');
      return;
    }
    setMessage('مقاله با موفقیت ذخیره شد.');
    setForm(initialForm);
    void load();
  };

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-black">مدیریت بلاگ</h1>

      <AdminCard title={form.id ? 'ویرایش مقاله' : 'ایجاد مقاله جدید'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel text="عنوان" /><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><FieldLabel text="اسلاگ (اختیاری)" /><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel text="خلاصه" /><TextInput value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel text="تصویر شاخص (URL)" /><TextInput value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel text="محتوای کامل" /><TextArea className="min-h-52" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> منتشر شود</label>
        </div>
        <div className="mt-4 flex items-center gap-3"><button className="h-11 rounded-xl bg-amber-600 px-4 text-white" onClick={save}>{form.id ? 'ذخیره تغییرات' : 'ایجاد مقاله'}</button><span className="text-sm text-slate-600">{message}</span></div>
      </AdminCard>

      <AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 text-right"><th>عنوان</th><th>اسلاگ</th><th>وضعیت</th><th>تاریخ انتشار</th><th>عملیات</th></tr>}>
        {items.map((p) => (
          <tr key={p._id} className="[&>td]:px-4 [&>td]:py-3">
            <td className="font-semibold">{p.title}</td>
            <td>{p.slug}</td>
            <td>{p.isPublished ? 'منتشر' : 'پیش‌نویس'}</td>
            <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fa-IR') : '-'}</td>
            <td className="space-x-3 space-x-reverse"><button className="text-amber-700" onClick={() => setForm({ id: p._id, title: p.title, slug: p.slug, excerpt: p.excerpt || '', coverImage: p.coverImage || '', content: p.content, isPublished: p.isPublished })}>ویرایش</button><button className="text-red-600" onClick={async () => { await fetch(`/api/admin/blog/${p._id}`, { method: 'DELETE' }); void load(); }}>حذف</button></td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
