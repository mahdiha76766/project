'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';

const ORDER_STATUS = ['PENDING_PAYMENT','PAID','PROCESSING','PACKED','SHIPPED','DELIVERED','CANCELED','RETURNED','REFUNDED'];

type Order = { _id: string; totalAmount: number; orderStatus: string; paymentStatus: string; trackingCode?: string; createdAt: string };

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const q = new URLSearchParams(Object.entries({ status, from, to }).filter(([,v])=>v));
      const res = await fetch(`/api/dashboard/orders?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت سفارش‌ها');
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || 'خطا');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return <div className='space-y-4'>
    <DashCard title='فیلتر سفارش‌ها'>
      <div className='grid gap-3 md:grid-cols-4'>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className='h-11 rounded-xl border px-3'>
          <option value=''>همه وضعیت‌ها</option>{ORDER_STATUS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input type='date' value={from} onChange={(e)=>setFrom(e.target.value)} className='h-11 rounded-xl border px-3' />
        <input type='date' value={to} onChange={(e)=>setTo(e.target.value)} className='h-11 rounded-xl border px-3' />
        <button onClick={load} className='h-11 rounded-xl bg-amber-600 px-4 font-bold text-white'>اعمال فیلتر</button>
      </div>
    </DashCard>

    <DashCard title='لیست سفارش‌ها'>
      {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length === 0 ? <DashEmpty text='هنوز سفارشی ندارید.' /> : <div className='overflow-x-auto'><table className='w-full min-w-[760px] text-sm'><thead className='text-slate-500'><tr className='[&>th]:px-3 [&>th]:py-2 text-right'><th>کد سفارش</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت سفارش</th><th>وضعیت پرداخت</th><th>رهگیری</th><th>جزئیات</th></tr></thead><tbody className='divide-y'>{items.map(o=><tr key={o._id} className='[&>td]:px-3 [&>td]:py-2'><td>{o._id.slice(-8)}</td><td>{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td><td>{o.totalAmount.toLocaleString('fa-IR')}</td><td>{o.orderStatus}</td><td>{o.paymentStatus}</td><td>{o.trackingCode || '-'}</td><td><Link href={`/dashboard/orders/${o._id}`} className='text-amber-700 font-bold'>مشاهده</Link></td></tr>)}</tbody></table></div>}
    </DashCard>
  </div>;
}
