'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BadgeCheck, Clock3, MessageCircle, MessageSquare, Pencil, Trash2, XCircle } from 'lucide-react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';
import { formatDashDate } from '@/lib/dashboard/formats';

type R = { _id: string; type: 'product'|'blog'; targetName: string; targetSlug?: string; title: string; comment: string; rating: number | null; status: 'PENDING'|'APPROVED'|'REJECTED'; createdAt: string };

const statusMeta = {
  PENDING: { label: 'در انتظار تایید', cls: 'bg-amber-100 text-amber-800', icon: Clock3 },
  APPROVED: { label: 'تایید شده', cls: 'bg-emerald-100 text-emerald-800', icon: BadgeCheck },
  REJECTED: { label: 'رد شده', cls: 'bg-rose-100 text-rose-800', icon: XCircle }
};

export default function Page() {
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<R | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/dashboard/reviews');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'خطا');
      setItems(d.items || []);
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{void load();},[]);

  const saveEdit = async () => {
    if (!editing) return;
    const payload: any = { id: editing._id, type: editing.type, title: editing.title, comment: editing.comment };
    if (editing.type === 'product') payload.rating = editing.rating;
    const res = await fetch('/api/dashboard/reviews', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (res.ok) { setEditing(null); void load(); }
  };

  return <DashCard title='نظرات و دیدگاه‌های من'>
    {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length===0 ? <DashEmpty text='هنوز نظری ثبت نکرده‌اید.' /> : <div className='space-y-3'>{items.map(r=>{ const meta=statusMeta[r.status]; const Icon=meta.icon; return <article key={r._id} className='rounded-2xl border bg-white p-4 shadow-sm'><div className='mb-2 flex flex-wrap items-center justify-between gap-2'><div className='inline-flex items-center gap-2 text-sm font-bold text-slate-800'>{r.type==='product'?<MessageSquare size={16} className='text-indigo-600'/>:<MessageCircle size={16} className='text-cyan-600'/>}{r.targetSlug ? <Link href={r.type==='product'?`/products/${r.targetSlug}`:`/blog/${r.targetSlug}`} className='hover:underline'>{r.targetName}</Link> : r.targetName}</div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${meta.cls}`}><Icon size={13}/>{meta.label}</span></div><p className='font-semibold text-slate-700'>{r.title}</p>{r.rating!==null?<p className='mt-1 text-xs text-amber-700'>امتیاز: {'★'.repeat(r.rating)}</p>:null}<p className='mt-2 text-sm text-slate-600'>{r.comment}</p><p className='mt-2 text-xs text-slate-500'>تاریخ: {formatDashDate(r.createdAt)}</p>{r.status==='PENDING'?<div className='mt-3 flex gap-2'><button className='inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800' onClick={()=>setEditing({...r})}><Pencil size={13}/>ویرایش</button><button className='inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700' onClick={async()=>{await fetch('/api/dashboard/reviews',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r._id,type:r.type})});void load();}}><Trash2 size={13}/>حذف</button></div>:null}</article>;})}</div>}

    {editing ? <div className='mt-4 rounded-2xl border bg-slate-50 p-4 text-sm'><p className='font-bold mb-2'>ویرایش {editing.type==='product'?'نظر محصول':'دیدگاه بلاگ'}</p><input className='mb-2 h-10 w-full rounded-lg border px-3' value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})} /><textarea className='mb-2 min-h-24 w-full rounded-lg border p-3' value={editing.comment} onChange={(e)=>setEditing({...editing,comment:e.target.value})} />{editing.type==='product'?<input type='number' min={1} max={5} className='mb-2 h-10 w-full rounded-lg border px-3' value={editing.rating || 0} onChange={(e)=>setEditing({...editing,rating:Number(e.target.value)})}/>:null}<div className='flex gap-2'><button onClick={saveEdit} className='rounded-lg bg-amber-600 px-3 py-1 text-white'>ذخیره</button><button onClick={()=>setEditing(null)} className='rounded-lg border px-3 py-1'>انصراف</button></div></div> : null}
  </DashCard>;
}
