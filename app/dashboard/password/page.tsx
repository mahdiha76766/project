'use client';
import { useState } from 'react';
import { DashCard } from '@/components/shop/DashboardUI';

export default function Page() {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true); setMessage('');
    const res = await fetch('/api/dashboard/password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
    const data = await res.json();
    setMessage(res.ok ? data.message : (data.error || 'خطا'));
    if (res.ok) setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    setLoading(false);
  };

  return <DashCard title='تغییر رمز عبور'><div className='grid gap-2 md:grid-cols-2'><input type='password' className='h-10 rounded-lg border px-3' placeholder='رمز فعلی' value={form.currentPassword} onChange={(e)=>setForm({...form,currentPassword:e.target.value})}/><input type='password' className='h-10 rounded-lg border px-3' placeholder='رمز جدید' value={form.newPassword} onChange={(e)=>setForm({...form,newPassword:e.target.value})}/><input type='password' className='h-10 rounded-lg border px-3 md:col-span-2' placeholder='تکرار رمز جدید' value={form.confirmPassword} onChange={(e)=>setForm({...form,confirmPassword:e.target.value})}/><button onClick={submit} disabled={loading} className='rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white md:col-span-2'>{loading?'در حال ذخیره...':'تغییر رمز عبور'}</button>{message ? <p className='text-sm md:col-span-2'>{message}</p> : null}</div></DashCard>;
}
