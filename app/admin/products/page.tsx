'use client';
import { useEffect, useState } from 'react';

type Cat = { _id: string; name: string };
type Prod = { _id: string; name: string; slug: string; price: number; stock: number; category?: Cat; attributes?: Record<string,string>; isActive:boolean };

export default function AdminProductsPage() {
  const [items, setItems] = useState<Prod[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState({ id:'', name:'', slug:'', shortDescription:'', fullDescription:'', category:'', price:'', stock:'', sku:'', tags:'', attributes:'{}', isActive:true });
  const load = async () => {
    const [p,c] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/categories')]);
    setItems((await p.json()).items || []);
    setCats((await c.json()).items || []);
  };
  useEffect(()=>{void load();},[]);
  const save = async () => {
    const payload = { ...form, price:Number(form.price), stock:Number(form.stock), tags:form.tags.split(',').map(s=>s.trim()).filter(Boolean), attributes: JSON.parse(form.attributes || '{}') };
    const method = form.id ? 'PUT':'POST'; const url = form.id?`/api/admin/products/${form.id}`:'/api/admin/products';
    await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    setForm({ id:'', name:'', slug:'', shortDescription:'', fullDescription:'', category:'', price:'', stock:'', sku:'', tags:'', attributes:'{}', isActive:true });
    void load();
  };
  return <main className="space-y-4"><h1 className="text-2xl font-black">مدیریت محصولات</h1>
  <div className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-4">
    <input className="rounded border p-2" placeholder="نام" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
    <input className="rounded border p-2" placeholder="اسلاگ" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/>
    <select className="rounded border p-2" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="">انتخاب دسته‌بندی</option>{cats.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select>
    <input className="rounded border p-2" placeholder="قیمت" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>
    <input className="rounded border p-2" placeholder="موجودی" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
    <input className="rounded border p-2" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
    <input className="rounded border p-2 md:col-span-2" placeholder="توضیح کوتاه" value={form.shortDescription} onChange={e=>setForm({...form,shortDescription:e.target.value})}/>
    <textarea className="rounded border p-2 md:col-span-4" placeholder="توضیح کامل" value={form.fullDescription} onChange={e=>setForm({...form,fullDescription:e.target.value})}/>
    <input className="rounded border p-2 md:col-span-2" placeholder="تگ‌ها با کاما" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
    <textarea className="rounded border p-2 md:col-span-2" placeholder='ویژگی‌ها JSON مثال {"origin":"همدان"}' value={form.attributes} onChange={e=>setForm({...form,attributes:e.target.value})}/>
    <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/>فعال</label>
    <button className="rounded bg-amber-600 px-3 py-2 text-white" onClick={save}>{form.id?'ویرایش':'ایجاد'}</button>
  </div>
  <table className="w-full rounded-xl border bg-white text-sm"><thead><tr><th>نام</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{items.map(p=><tr key={p._id} className="border-t"><td>{p.name}</td><td>{p.category?.name||'-'}</td><td>{p.price.toLocaleString('fa-IR')}</td><td>{p.stock}</td><td>{p.isActive?'فعال':'غیرفعال'}</td><td><button onClick={()=>setForm({id:p._id,name:p.name,slug:p.slug,shortDescription:'',fullDescription:'',category:p.category?._id||'',price:String(p.price),stock:String(p.stock),sku:'',tags:'',attributes:JSON.stringify(p.attributes||{},null,0),isActive:p.isActive})}>ویرایش</button> <button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/products/${p._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}</tbody></table>
  </main>;
}
