'use client';

import { useEffect, useState } from 'react';

type Review={_id:string;title:string;comment:string;rating:number|string;status:'PENDING'|'APPROVED'|'REJECTED';adminReply?:string;createdAt:string;userName?:string;userId?:{name?:string;mobile?:string};productId?:{name?:string};reviewType?:'product'|'blog'};

export default function AdminReviewsPage(){
  const [items,setItems]=useState<Review[]>([]);
  const [filters,setFilters]=useState({type:'all',productId:'',userId:'',rating:'',status:'',dateFrom:'',dateTo:''});

  const load=async()=>{
    const q=new URLSearchParams(Object.entries(filters).filter(([,v])=>v));
    const res=await fetch(`/api/admin/reviews?${q.toString()}`); const data=await res.json(); setItems(data.items||[]);
  };
  useEffect(()=>{void load();},[]);

  const updateReview = async (review: Review,payload:Record<string,unknown>,msg:string)=>{ if(!confirm(msg)) return; const base = review.reviewType==='blog' ? '/api/admin/blog-comments' : '/api/admin/reviews'; await fetch(`${base}/${review._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); void load(); };

  return <main className="space-y-6"><h1 className="text-2xl font-black">مدیریت نظرات</h1>
  <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3 xl:grid-cols-7">
    <select className="h-11 rounded-xl border border-slate-200 px-3" value={filters.type} onChange={(e)=>setFilters({...filters,type:e.target.value})}><option value="all">همه نظرات</option><option value="product">نظرات محصولات</option><option value="blog">نظرات بلاگ</option></select><input className="h-11 rounded-xl border border-slate-200 px-3" placeholder="Product ID" value={filters.productId} onChange={(e)=>setFilters({...filters,productId:e.target.value})}/>
    <input className="h-11 rounded-xl border border-slate-200 px-3" placeholder="User ID" value={filters.userId} onChange={(e)=>setFilters({...filters,userId:e.target.value})}/>
    <select className="h-11 rounded-xl border border-slate-200 px-3" value={filters.rating} onChange={(e)=>setFilters({...filters,rating:e.target.value})}><option value="">امتیاز</option>{[1,2,3,4,5].map(n=><option key={n} value={String(n)}>{n}</option>)}</select>
    <select className="h-11 rounded-xl border border-slate-200 px-3" value={filters.status} onChange={(e)=>setFilters({...filters,status:e.target.value})}><option value="">وضعیت</option><option value="PENDING">در انتظار تایید</option><option value="APPROVED">تایید شده</option><option value="REJECTED">رد شده</option></select>
    <input className="h-11 rounded-xl border border-slate-200 px-3" type="date" value={filters.dateFrom} onChange={(e)=>setFilters({...filters,dateFrom:e.target.value})}/>
    <input className="h-11 rounded-xl border border-slate-200 px-3" type="date" value={filters.dateTo} onChange={(e)=>setFilters({...filters,dateTo:e.target.value})}/>
    <button onClick={load} className="h-11 rounded-xl bg-amber-600 px-4 text-white">اعمال فیلتر</button>
  </div>
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-slate-50 text-slate-600"><tr className="[&>th]:px-4 [&>th]:py-3 text-right"><th>نوع</th><th>کاربر</th><th>محصول/بلاگ</th><th>امتیاز</th><th>وضعیت</th><th>تاریخ</th><th>متن</th><th>پاسخ ادمین</th><th>عملیات</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map(r=><tr key={r._id} className="[&>td]:px-4 [&>td]:py-3 align-top"><td>{(r as any).reviewType==='blog'?'بلاگ':'محصول'}</td><td>{r.userId?.name||r.userName||r.userId?.mobile||'-'}</td><td>{r.productId?.name||'-'}</td><td>{r.rating}</td><td>{r.status==='PENDING'?'در انتظار تایید':r.status==='APPROVED'?'تایید شده':'رد شده'}</td><td>{new Date(r.createdAt).toLocaleDateString('fa-IR')}</td><td><div className="max-w-xs"><p className="font-semibold">{r.title}</p><p className="text-xs text-slate-600 whitespace-pre-wrap">{r.comment}</p></div></td><td>{r.reviewType==='blog' ? <span className='text-xs text-slate-400'>---</span> : <input className="h-10 w-full rounded-xl border border-slate-200 px-3" defaultValue={r.adminReply||''} onBlur={(e)=>{ if(e.target.value !== (r.adminReply||'')) void updateReview(r,{adminReply:e.target.value},'ثبت پاسخ ادمین انجام شود؟'); }} />}</td><td className="space-y-1"><button className="block text-emerald-700" onClick={()=>void updateReview(r,{action:'approve'},'این نظر تایید شود؟')}>تایید</button><button className="block text-orange-700" onClick={()=>void updateReview(r,{action:'reject'},'این نظر رد شود؟')}>رد</button><button className="block text-amber-700" onClick={()=>{ const title=prompt('عنوان جدید',r.title)||r.title; const comment=prompt('متن جدید',r.comment)||r.comment; void updateReview(r,{title,comment},'نظر ویرایش شود؟'); }}>ویرایش</button><button className="block text-red-600" onClick={()=>void updateReview(r,{action:'soft_delete'},'حذف نرم انجام شود؟')}>حذف نرم</button></td></tr>)}</tbody></table></div></div>
  </main>;
}
