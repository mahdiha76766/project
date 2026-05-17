'use client';

import { useMemo, useState } from 'react';

const stats = [
  ['فروش امروز', '12,500,000 تومان'],
  ['فروش ماه', '287,000,000 تومان'],
  ['سفارش جدید', '34'],
  ['در انتظار ارسال', '19'],
  ['محصولات کم‌موجودی', '7'],
  ['تعداد کاربران', '1,284']
];

const orders = Array.from({ length: 18 }).map((_, i) => ({ id: `ORD-${3200 + i}`, customer: `مشتری ${i + 1}`, amount: (i + 2) * 210000, status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'paid' : 'shipped' }));

const statusClass: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-emerald-100 text-emerald-800'
};

export default function AdminPage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const perPage = 6;

  const paged = useMemo(() => orders.slice((page - 1) * perPage, page * perPage), [page]);
  const pages = Math.ceil(orders.length / perPage);

  return <div className="space-y-6">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([t,v]) => <div key={t} className="rounded-2xl border bg-white p-4"><p className="text-sm text-slate-500">{t}</p><p className="mt-2 text-2xl font-black">{v}</p></div>)}</section>
    <section className="grid gap-4 xl:grid-cols-3"><div className="rounded-2xl border bg-white p-4 xl:col-span-2"><h2 className="font-bold">نمودار فروش (7 روز اخیر)</h2><div className="mt-4 flex h-52 items-end gap-2">{[45,70,40,85,60,75,92].map((v,i)=><div key={i} className="flex-1 rounded-t-md bg-amber-400" style={{height:`${v}%`}} />)}</div></div><div className="rounded-2xl border bg-white p-4"><h2 className="font-bold">محصولات پرفروش</h2><ul className="mt-3 space-y-2 text-sm">{['روغن سیاهدانه','پودر زنجبیل','روغن کنجد','ادویه پلویی','عرق نعنا'].map((x)=> <li key={x} className="rounded-lg bg-slate-50 p-2">{x}</li>)}</ul></div></section>

    <section className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">آخرین سفارش‌ها</h2><div className="flex gap-2"><button className="rounded-lg border px-3 py-1 text-sm" onClick={()=>{setLoading(true); setTimeout(()=>setLoading(false),500);}}>بازخوانی</button><button className="rounded-lg border px-3 py-1 text-sm" onClick={()=>setError('خطا در دریافت سفارش‌ها. لطفاً دوباره تلاش کنید.')}>شبیه‌سازی خطا</button></div></div>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : loading ? <div className="space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}</div> : paged.length===0 ? <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">سفارشی یافت نشد.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-right text-slate-500"><th>کد</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{paged.map((o)=><tr key={o.id} className="border-t"><td className="py-2">{o.id}</td><td>{o.customer}</td><td>{o.amount.toLocaleString('fa-IR')}</td><td><span className={`rounded-full px-2 py-1 text-xs ${statusClass[o.status]}`}>{o.status}</span></td><td><button className="text-amber-700" onClick={()=>setSelected(o.id)}>جزئیات</button></td></tr>)}</tbody></table></div>}
      <div className="mt-4 flex items-center justify-center gap-2">{Array.from({length:pages}).map((_,i)=><button key={i} onClick={()=>setPage(i+1)} className={`h-8 w-8 rounded ${page===i+1?'bg-amber-600 text-white':'border'}`}>{i+1}</button>)}</div>
    </section>

    {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={()=>setSelected(null)}><div className="w-full max-w-md rounded-2xl bg-white p-5" onClick={(e)=>e.stopPropagation()}><h3 className="font-bold">جزئیات سفارش {selected}</h3><p className="mt-2 text-sm text-slate-600">اینجا می‌توانید وضعیت، رهگیری و آیتم‌های سفارش را مدیریت کنید.</p><button className="mt-4 rounded-lg border px-3 py-2" onClick={()=>setSelected(null)}>بستن</button></div></div>}
  </div>;
}
