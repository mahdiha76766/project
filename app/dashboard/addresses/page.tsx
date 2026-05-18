'use client';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';

type Address = { _id: string; recipientName: string; phone: string; province: string; city: string; addressLine: string; postalCode: string; plaque?: string; unit?: string; isDefault: boolean };
const initial = { id:'', recipientName:'', phone:'', province:'', city:'', addressLine:'', postalCode:'', plaque:'', unit:'', isDefault:false };

export default function Page() {
  const [items, setItems] = useState<Address[]>([]); const [form, setForm] = useState(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const r=await fetch('/api/dashboard/addresses'); const d=await r.json(); if(!r.ok) throw new Error(d.error||'خطا'); setItems(d.items||[]); } catch(e:any){setError(e.message);} finally{setLoading(false);} };
  useEffect(()=>{void load();},[]);
  const save = async () => { setMessage(''); const method=form.id?'PUT':'POST'; const url=form.id?`/api/dashboard/addresses/${form.id}`:'/api/dashboard/addresses'; const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...form})}); const d=await res.json(); if(!res.ok){setMessage(d.error||'خطا');return;} setMessage('با موفقیت ذخیره شد.'); setForm(initial); void load(); };

  return <div className='space-y-4'>
    <DashCard title='افزودن / ویرایش آدرس'>
      <div className='grid gap-2 md:grid-cols-2'><input className='h-10 rounded-lg border px-3' placeholder='نام گیرنده' value={form.recipientName} onChange={(e)=>setForm({...form,recipientName:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='شماره تماس' value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='استان' value={form.province} onChange={(e)=>setForm({...form,province:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='شهر' value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/><input className='h-10 rounded-lg border px-3 md:col-span-2' placeholder='آدرس کامل' value={form.addressLine} onChange={(e)=>setForm({...form,addressLine:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='کد پستی' value={form.postalCode} onChange={(e)=>setForm({...form,postalCode:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='پلاک' value={form.plaque} onChange={(e)=>setForm({...form,plaque:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='واحد' value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})}/><label className='inline-flex items-center gap-2 text-sm'><input type='checkbox' checked={form.isDefault} onChange={(e)=>setForm({...form,isDefault:e.target.checked})}/> آدرس پیش‌فرض</label></div>
      <button onClick={save} className='mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white'>{form.id?'ذخیره تغییرات':'افزودن آدرس'}</button>{message ? <p className='mt-2 text-sm'>{message}</p> : null}
    </DashCard>

    <DashCard title='لیست آدرس‌ها'>{loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length===0 ? <DashEmpty text='آدرسی ثبت نشده است.' /> : <div className='space-y-2'>{items.map(a=><div key={a._id} className='rounded-xl border p-3 text-sm'><p className='font-bold'>{a.recipientName} {a.isDefault ? '(پیش‌فرض)' : ''}</p><p>{a.phone} - {a.province}، {a.city}</p><p>{a.addressLine}، پلاک {a.plaque || '-'}، واحد {a.unit || '-'}</p><p>کدپستی: {a.postalCode}</p><div className='mt-2 flex gap-3'><button className='text-amber-700' onClick={()=>setForm({id:a._id,recipientName:a.recipientName,phone:a.phone,province:a.province,city:a.city,addressLine:a.addressLine,postalCode:a.postalCode,plaque:a.plaque||'',unit:a.unit||'',isDefault:a.isDefault})}>ویرایش</button><button className='text-red-600' onClick={async()=>{await fetch(`/api/dashboard/addresses/${a._id}`,{method:'DELETE'});void load();}}>حذف</button></div></div>)}</div>}</DashCard>
  </div>;
}
