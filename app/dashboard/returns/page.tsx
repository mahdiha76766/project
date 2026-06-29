'use client';

import { useEffect, useState } from 'react';
import { DashBadge, DashCard, DashEmpty } from '@/components/shop/DashboardUI';
import { RETURN_STATUS_LABELS } from '@/lib/dashboard/labels';
import { formatDashDate, shortId } from '@/lib/dashboard/formats';
import { ORDER_STATUS_LABELS } from '@/lib/admin/labels';

type Order = { _id: string; orderStatus: string };
type ReturnReq = { _id: string; orderId: string; reason: string; status: string; createdAt: string };

export default function ReturnsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnReq[]>([]);
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [o, r] = await Promise.all([fetch('/api/dashboard/orders'), fetch('/api/dashboard/returns')]);
    setOrders((await o.json()).items || []);
    setReturns((await r.json()).items || []);
  };
  useEffect(() => { void load(); }, []);

  const submit = async () => {
    const res = await fetch('/api/dashboard/returns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, reason }) });
    const data = await res.json();
    setMessage(res.ok ? 'درخواست مرجوعی ثبت شد.' : (data.error || 'خطا'));
    if (res.ok) { setReason(''); void load(); }
  };

  const eligible = orders.filter((o) => ['DELIVERED','SHIPPED'].includes(o.orderStatus));

  return <div className='space-y-4'>
    <DashCard title='ثبت درخواست مرجوعی'>
      <div className='grid gap-3 md:grid-cols-3'>
        <select value={orderId} onChange={(e)=>setOrderId(e.target.value)} className='h-11 rounded-xl border px-3'><option value=''>انتخاب سفارش مجاز</option>{eligible.map(o=><option key={o._id} value={o._id}>{shortId(o._id)} - {ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus}</option>)}</select>
        <input value={reason} onChange={(e)=>setReason(e.target.value)} placeholder='دلیل مرجوعی' className='h-11 rounded-xl border px-3 md:col-span-2' />
      </div>
      <button onClick={submit} className='mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white'>ثبت درخواست</button>
      {message ? <p className='mt-2 text-sm'>{message}</p> : null}
    </DashCard>

    <DashCard title='پیگیری درخواست‌های مرجوعی'>
      {returns.length === 0 ? <DashEmpty text='درخواستی ثبت نشده است.' /> : <div className='space-y-2'>{returns.map(r=><div key={r._id} className='rounded-xl border p-3 text-sm'><p>سفارش: <strong>{shortId(String(r.orderId))}</strong></p><p>دلیل: {r.reason}</p><p className='mt-1'><DashBadge label={RETURN_STATUS_LABELS[r.status] || r.status} tone='amber' /></p><p className='mt-1 text-slate-500'>تاریخ: {formatDashDate(r.createdAt)}</p></div>)}</div>}
    </DashCard>
  </div>;
}
