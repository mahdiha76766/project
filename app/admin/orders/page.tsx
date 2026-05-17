'use client';
import { useEffect, useState } from 'react';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/constants/order';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { SelectInput } from '@/components/admin/ui/AdminField';

type Order = { _id:string; totalAmount:number; orderStatus:string; paymentStatus:string; user?:{name?:string;mobile?:string}; createdAt:string };

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const load = async () => setItems((await (await fetch('/api/admin/orders')).json()).items || []);
  useEffect(()=>{void load();},[]);

  return <main className="space-y-6"><h1 className="text-2xl font-black text-slate-900">مدیریت سفارش‌ها</h1>
    <AdminCard title="لیست سفارش‌ها"><AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-right"><th>مشتری</th><th>مبلغ</th><th>وضعیت سفارش</th><th>وضعیت پرداخت</th><th>تاریخ</th><th>عملیات</th></tr>}>
      {items.map(o=><tr key={o._id} className="[&>td]:px-4 [&>td]:py-3"><td className="font-medium">{o.user?.name||o.user?.mobile||'-'}</td><td>{o.totalAmount.toLocaleString('fa-IR')}</td><td className="min-w-44"><SelectInput value={o.orderStatus} onChange={async(e)=>{await fetch(`/api/admin/orders/${o._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderStatus:e.target.value})});void load();}}>{ORDER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</SelectInput></td><td className="min-w-44"><SelectInput value={o.paymentStatus} onChange={async(e)=>{await fetch(`/api/admin/orders/${o._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentStatus:e.target.value})});void load();}}>{PAYMENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</SelectInput></td><td>{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td><td><button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/orders/${o._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}
    </AdminTable></AdminCard></main>;
}
