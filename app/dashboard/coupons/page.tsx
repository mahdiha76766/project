'use client';
import { useEffect, useState } from 'react';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';
import { DISCOUNT_TYPE_LABELS } from '@/lib/admin/labels';
import { COUPON_STATUS_LABELS } from '@/lib/dashboard/labels';
import { formatDashCurrency, formatDashDate } from '@/lib/dashboard/formats';

type C = { _id: string; code: string; discountType: string; value: number; minPurchaseAmount: number; usageLimit: number; usagePerUserLimit: number; expiresAt: string; status: 'ACTIVE'|'USED'|'EXPIRED'|'INACTIVE' };

const couponTone = (status: C['status']) => {
  if (status === 'ACTIVE') return 'emerald';
  if (status === 'USED') return 'sky';
  if (status === 'EXPIRED') return 'rose';
  return 'slate';
};

export default function Page() {
  const [items, setItems] = useState<C[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try{ const r=await fetch('/api/dashboard/coupons'); const d=await r.json(); if(!r.ok) throw new Error(d.error||'خطا'); setItems(d.items||[]);} catch(e:any){setError(e.message);} finally{setLoading(false);} };
  useEffect(()=>{void load();},[]);

  return <DashCard title='کدهای تخفیف من'>
    {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length===0 ? <DashEmpty text='کد تخفیفی ندارید.' /> : <div className='space-y-2'>{items.map(c=><div key={c._id} className='rounded-xl border p-3 text-sm'><div className='flex items-center justify-between'><p className='font-black'>{c.code}</p><DashBadge label={COUPON_STATUS_LABELS[c.status] || c.status} tone={couponTone(c.status)} /></div><p className='mt-1'>نوع: {DISCOUNT_TYPE_LABELS[c.discountType] || c.discountType} | مقدار: {Number(c.value).toLocaleString('fa-IR')}</p><p>حداقل خرید: {formatDashCurrency(c.minPurchaseAmount || 0)}</p><p>انقضا: {formatDashDate(c.expiresAt)}</p><p>اعتبار باقی‌مانده: {Math.max(0, Number(c.usageLimit||0) - Number(c.usagePerUserLimit||0)).toLocaleString('fa-IR')}</p></div>)}</div>}
  </DashCard>;
}
