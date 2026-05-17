'use client';
import { useEffect, useState } from 'react';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/constants/order';

type Order = { _id:string; totalAmount:number; orderStatus:string; paymentStatus:string; user?:{name?:string;mobile?:string}; createdAt:string };

export default function AdminOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const load = async () => setItems((await (await fetch('/api/admin/orders')).json()).items || []);
  useEffect(()=>{void load();},[]);

  return <main className="space-y-4"><h1 className="text-2xl font-black">مدیریت سفارش‌ها</h1>
    <table className="w-full rounded-xl border bg-white text-sm"><thead><tr><th>مشتری</th><th>مبلغ</th><th>وضعیت سفارش</th><th>وضعیت پرداخت</th><th>تاریخ</th><th>عملیات</th></tr></thead><tbody>{items.map(o=><tr key={o._id} className="border-t"><td>{o.user?.name||o.user?.mobile||'-'}</td><td>{o.totalAmount.toLocaleString('fa-IR')}</td><td><select value={o.orderStatus} onChange={async(e)=>{await fetch(`/api/admin/orders/${o._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderStatus:e.target.value})});void load();}}>{ORDER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></td><td><select value={o.paymentStatus} onChange={async(e)=>{await fetch(`/api/admin/orders/${o._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentStatus:e.target.value})});void load();}}>{PAYMENT_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></td><td>{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td><td><button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/orders/${o._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}</tbody></table>
  </main>;
}
