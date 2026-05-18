'use client';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';

type R = { _id: string; title: string; comment: string; rating: number; status: 'PENDING'|'APPROVED'|'REJECTED'; createdAt: string; productId?: { name?: string } };

export default function Page() {
  const [items, setItems] = useState<R[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const [editing, setEditing] = useState<R | null>(null);

  const load = async () => { setLoading(true); setError(''); try{ const r=await fetch('/api/dashboard/reviews'); const d=await r.json(); if(!r.ok) throw new Error(d.error||'خطا'); setItems(d.items||[]);}catch(e:any){setError(e.message);} finally{setLoading(false);} };
  useEffect(()=>{void load();},[]);

  const saveEdit = async () => { if(!editing) return; const res=await fetch('/api/dashboard/reviews',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editing._id,title:editing.title,comment:editing.comment,rating:editing.rating})}); if(res.ok){setEditing(null); void load();} };

  return <DashCard title='نظرات من'>
    {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length===0 ? <DashEmpty text='هنوز نظری ثبت نکرده‌اید.' /> : <div className='space-y-2'>{items.map(r=><div key={r._id} className='rounded-xl border p-3 text-sm'><p className='font-bold'>{r.productId?.name || 'محصول'} - {r.rating}⭐</p><p className='font-semibold mt-1'>{r.title}</p><p className='mt-1 text-slate-600'>{r.comment}</p><p className='mt-1 text-xs text-slate-500'>وضعیت: {r.status==='PENDING'?'در انتظار تایید':r.status==='APPROVED'?'تایید شده':'رد شده'} | تاریخ: {new Date(r.createdAt).toLocaleDateString('fa-IR')}</p>{r.status==='PENDING'?<div className='mt-2 flex gap-2'><button className='rounded-lg border px-3 py-1 text-xs text-amber-700' onClick={()=>setEditing({...r})}>ویرایش</button><button className='rounded-lg border px-3 py-1 text-xs text-red-700' onClick={async()=>{await fetch('/api/dashboard/reviews',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:r._id})});void load();}}>حذف</button></div>:null}</div>)}</div>}
    {editing ? <div className='mt-4 rounded-xl border bg-slate-50 p-3 text-sm'><p className='font-bold mb-2'>ویرایش نظر</p><input className='mb-2 h-10 w-full rounded border px-3' value={editing.title} onChange={(e)=>setEditing({...editing,title:e.target.value})}/><textarea className='mb-2 min-h-24 w-full rounded border p-3' value={editing.comment} onChange={(e)=>setEditing({...editing,comment:e.target.value})}/><input type='number' min={1} max={5} className='mb-2 h-10 w-full rounded border px-3' value={editing.rating} onChange={(e)=>setEditing({...editing,rating:Number(e.target.value)})}/><div className='flex gap-2'><button onClick={saveEdit} className='rounded-lg bg-amber-600 px-3 py-1 text-white'>ذخیره</button><button onClick={()=>setEditing(null)} className='rounded-lg border px-3 py-1'>انصراف</button></div></div> : null}
  </DashCard>;
}
