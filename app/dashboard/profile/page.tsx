'use client';
import { useEffect, useState } from 'react';
import { DashCard } from '@/components/shop/DashboardUI';

export default function Page() {
  const [form, setForm] = useState({ firstName:'', lastName:'', mobile:'', email:'' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async()=>{ const res=await fetch('/api/dashboard/profile'); const data=await res.json(); if(res.ok && data.profile) setForm(data.profile); setLoading(false); })(); }, []);

  const save = async () => {
    const res = await fetch('/api/dashboard/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    setMessage(res.ok ? 'پروفایل با موفقیت به‌روزرسانی شد.' : (data.error || 'خطا'));
  };

  return <DashCard title='ویرایش پروفایل'>{loading ? <p>در حال بارگذاری...</p> : <div className='grid gap-2 md:grid-cols-2'><input className='h-10 rounded-lg border px-3' placeholder='نام' value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='نام خانوادگی' value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='شماره تماس' value={form.mobile} onChange={(e)=>setForm({...form,mobile:e.target.value})}/><input className='h-10 rounded-lg border px-3' placeholder='ایمیل' value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><button onClick={save} className='rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white md:col-span-2'>ذخیره</button>{message ? <p className='text-sm md:col-span-2'>{message}</p> : null}</div>}</DashCard>;
}
