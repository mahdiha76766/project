'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { FieldLabel, SelectInput, TextArea, TextInput } from '@/components/admin/ui/AdminField';
import { AdminDataTable } from '@/components/admin/ui/AdminDataTable';
import { DeleteButton, EditButton } from '@/components/admin/ui/AdminActionButtons';

type Cat = { _id: string; name: string; slug: string; description?: string; image?: string; isActive: boolean; parent?: { _id: string; name: string } | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', slug: '', description: '', image: '', parent: '', isActive: true });
  const load = async () => setItems((await (await fetch('/api/admin/categories')).json()).items || []);
  useEffect(() => { void load(); }, []);

  const uploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('حجم تصویر باید کمتر از ۲ مگابایت باشد.');
      return;
    }
    setError('');
    setIsUploading(true);
    setMessage('در حال آپلود تصویر...');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/categories/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در آپلود تصویر.');
        setMessage('');
        return;
      }
      setForm((f) => ({ ...f, image: data.url }));
      setMessage('آپلود تصویر با موفقیت انجام شد.');
    } catch (err) {
      console.error(err);
      setError('خطا در آپلود تصویر.');
      setMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const save = async () => {
    if (isUploading) {
      setError('لطفاً تا پایان آپلود تصویر صبر کنید.');
      return;
    }
    setError('');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, slug: form.slug, description: form.description, image: form.image, parent: form.parent || null, isActive: form.isActive }) });
    if (!res.ok) setError((await res.json()).error || 'خطا در ذخیره اطلاعات');
    else {
      setForm({ id: '', name: '', slug: '', description: '', image: '', parent: '', isActive: true });
      setMessage('ذخیره دسته‌بندی با موفقیت انجام شد.');
      void load();
    }
  };

  return <main className="space-y-6"><h1 className="text-2xl font-black text-slate-900">مدیریت دسته‌بندی‌ها</h1>
    <AdminCard title={form.id ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی'}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div><FieldLabel text="نام" /><TextInput value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></div>
        <div><FieldLabel text="اسلاگ" /><TextInput value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></div>
        <div><FieldLabel text="دسته والد" /><SelectInput value={form.parent} onChange={(e)=>setForm({...form,parent:e.target.value})}><option value="">بدون والد</option>{items.filter(x=>x._id!==form.id).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</SelectInput></div>
        <label className="mt-7 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})}/> فعال</label>
        <div className='xl:col-span-2'><FieldLabel text='توضیحات' /><TextArea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} /></div>
        <div className='xl:col-span-2'><FieldLabel text='تصویر دسته‌بندی' /><TextInput value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} placeholder='/uploads/categories/...' /><input type='file' accept='image/jpeg,image/png,image/webp,image/gif' className='mt-2 block w-full rounded-lg border p-2' onChange={uploadImage} />{form.image ? <img src={form.image} alt='preview' className='mt-2 h-24 w-24 rounded-lg object-cover' /> : null}</div>
      </div>
      {error ? <p className='mt-3 text-sm text-red-600'>{error}</p> : null}
      {message ? <p className='mt-2 text-sm text-emerald-700'>{message}</p> : null}
      <button disabled={isUploading} className="mt-4 h-11 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={save}>{isUploading ? 'در حال آپلود...' : (form.id?'ذخیره تغییرات':'ایجاد دسته‌بندی')}</button>
    </AdminCard>

    <AdminDataTable data={items} rowKey={(c)=>c._id} columns={[
      {header:'تصویر', render:(c)=><img src={c.image || 'https://via.placeholder.com/80'} alt={c.name} className='h-12 w-12 rounded-lg object-cover'/>},
      {header:'نام', render:(c)=><span className='font-medium'>{c.name}</span>},
      {header:'اسلاگ', render:(c)=>c.slug},
      {header:'والد', render:(c)=>c.parent?.name||'-'},
      {header:'وضعیت', render:(c)=><span className={`rounded-full px-2 py-1 text-xs ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.isActive?'فعال':'غیرفعال'}</span>},
      {header:'عملیات', render:(c)=><div className='space-x-2 space-x-reverse'><EditButton onClick={()=>setForm({id:c._id,name:c.name,slug:c.slug,description:c.description||'',image:c.image||'',parent:c.parent?._id||'',isActive:c.isActive})}/><DeleteButton onClick={async()=>{const res=await fetch(`/api/admin/categories/${c._id}`,{method:'DELETE'});if(!res.ok){setError((await res.json()).error || 'حذف انجام نشد');}else{void load();}}}/></div>}
    ]} />
  </main>;
}
