'use client';
import { useEffect, useState } from 'react';

type Cat = { _id: string; name: string; slug: string; isActive: boolean; parent?: { _id: string; name: string } | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [form, setForm] = useState({ id: '', name: '', slug: '', parent: '', isActive: true });
  const load = async () => setItems((await (await fetch('/api/admin/categories')).json()).items || []);
  useEffect(() => { void load(); }, []);
  const save = async () => {
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, slug: form.slug, parent: form.parent || null, isActive: form.isActive }) });
    setForm({ id: '', name: '', slug: '', parent: '', isActive: true });
    void load();
  };
  return <main className="space-y-4"><h1 className="text-2xl font-black">مدیریت دسته‌بندی‌ها</h1><div className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-5"><input className="rounded border p-2" placeholder="نام" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/><input className="rounded border p-2" placeholder="اسلاگ" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/><select className="rounded border p-2" value={form.parent} onChange={(e)=>setForm({...form,parent:e.target.value})}><option value="">بدون والد</option>{items.filter(x=>x._id!==form.id).map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select><label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm({...form,isActive:e.target.checked})}/>فعال</label><button className="rounded bg-amber-600 px-3 py-2 text-white" onClick={save}>{form.id?'ویرایش':'ایجاد'}</button></div><table className="w-full rounded-xl border bg-white text-sm"><thead><tr><th>نام</th><th>اسلاگ</th><th>والد</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{items.map(c=><tr key={c._id} className="border-t"><td>{c.name}</td><td>{c.slug}</td><td>{c.parent?.name||'-'}</td><td>{c.isActive?'فعال':'غیرفعال'}</td><td className="space-x-2 space-x-reverse"><button onClick={()=>setForm({id:c._id,name:c.name,slug:c.slug,parent:c.parent?._id||'',isActive:c.isActive})}>ویرایش</button><button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/categories/${c._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}</tbody></table></main>;
}
