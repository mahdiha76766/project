'use client';
import { useEffect, useState } from 'react';
import { AdminCard, AdminDataTable, DeleteButton, EditButton, FieldLabel, SelectInput, TextInput } from '@/components/admin/ui';

type Cat = { _id: string; name: string; slug: string; isActive: boolean; parent?: { _id: string; name: string } | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [form, setForm] = useState({ id: '', name: '', slug: '', parent: '', isActive: true });
  const load = async () => setItems((await (await fetch('/api/admin/categories')).json()).items || []);
  useEffect(() => { void load(); }, []);
  const save = async () => { const method = form.id ? 'PUT' : 'POST'; const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories'; await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, slug: form.slug, parent: form.parent || null, isActive: form.isActive }) }); setForm({ id: '', name: '', slug: '', parent: '', isActive: true }); void load(); };

  return <main className="space-y-6"><h1 className="text-2xl font-black text-slate-900">مدیریت دسته‌بندی‌ها</h1>
    <AdminCard title={form.id ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی'}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><FieldLabel text="نام" /><TextInput value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></div><div><FieldLabel text="اسلاگ" /><TextInput value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></div><div><FieldLabel text="دسته والد" /><SelectInput value={form.parent} onChange={(e)=>setForm({...form,parent:e.target.value})}><option value="">بدون والد</option>{items.filter(x=>x._id!==form.id).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</SelectInput></div><label className="mt-7 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})}/> فعال</label></div><button className="mt-4 h-11 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white" onClick={save}>{form.id?'ذخیره تغییرات':'ایجاد دسته‌بندی'}</button></AdminCard>

    <AdminDataTable data={items} rowKey={(c)=>c._id} columns={[
      {header:'نام', render:(c)=><span className='font-medium'>{c.name}</span>},
      {header:'اسلاگ', render:(c)=>c.slug},
      {header:'والد', render:(c)=>c.parent?.name||'-'},
      {header:'وضعیت', render:(c)=><span className={`rounded-full px-2 py-1 text-xs ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{c.isActive?'فعال':'غیرفعال'}</span>},
      {header:'عملیات', render:(c)=><div className='space-x-2 space-x-reverse'><EditButton onClick={()=>setForm({id:c._id,name:c.name,slug:c.slug,parent:c.parent?._id||'',isActive:c.isActive})}/><DeleteButton onClick={async()=>{await fetch(`/api/admin/categories/${c._id}`,{method:'DELETE'});void load();}}/></div>}
    ]} />
  </main>;
}
