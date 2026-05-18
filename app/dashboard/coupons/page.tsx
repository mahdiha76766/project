'use client';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';

type C = { _id: string; code: string; discountType: string; value: number; minPurchaseAmount: number; usageLimit: number; usagePerUserLimit: number; expiresAt: string; status: 'ACTIVE'|'USED'|'EXPIRED'|'INACTIVE' };

export default function Page() {
  const [items, setItems] = useState<C[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try{ const r=await fetch('/api/dashboard/coupons'); const d=await r.json(); if(!r.ok) throw new Error(d.error||'خطا'); setItems(d.items||[]);} catch(e:any){setError(e.message);} finally{setLoading(false);} };
  useEffect(()=>{void load();},[]);

  return <DashCard title='کدهای تخفیف من'>
    {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length===0 ? <DashEmpty text='کد تخفیفی ندارید.' /> : <div className='space-y-2'>{items.map(c=>{ const badge = c.status==='ACTIVE'?'bg-emerald-100 text-emerald-700':c.status==='USED'?'bg-blue-100 text-blue-700':c.status==='EXPIRED'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-700'; return <div key={c._id} className='rounded-xl border p-3 text-sm'><div className='flex items-center justify-between'><p className='font-black'>{c.code}</p><span className={`rounded-full px-2 py-1 text-xs ${badge}`}>{c.status}</span></div><p className='mt-1'>نوع: {c.discountType} | مقدار: {c.value}</p><p>حداقل خرید: {Number(c.minPurchaseAmount||0).toLocaleString('fa-IR')}</p><p>انقضا: {new Date(c.expiresAt).toLocaleDateString('fa-IR')}</p><p>اعتبار باقی‌مانده: {Math.max(0, Number(c.usageLimit||0) - Number(c.usagePerUserLimit||0))}</p></div>;})}</div>}
  </DashCard>;
}
