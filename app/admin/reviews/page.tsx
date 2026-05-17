'use client';
import { useEffect, useState } from 'react';
import { AdminTable } from '@/components/admin/ui/AdminTable';

type Review={_id:string;comment:string;rating:number;isApproved:boolean;user?:{name?:string;mobile?:string};product?:{name?:string}};
export default function AdminReviewsPage(){const [items,setItems]=useState<Review[]>([]); const load=async()=>setItems((await (await fetch('/api/admin/reviews')).json()).items||[]); useEffect(()=>{void load();},[]);
return <main className="space-y-6"><h1 className="text-2xl font-black">مدیریت نظرات</h1><AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 text-right"><th>کاربر</th><th>محصول</th><th>امتیاز</th><th>نظر</th><th>تایید</th><th>عملیات</th></tr>}>{items.map(r=><tr key={r._id} className="[&>td]:px-4 [&>td]:py-3"><td>{r.user?.name||r.user?.mobile||'-'}</td><td>{r.product?.name||'-'}</td><td>{r.rating}</td><td>{r.comment}</td><td>{r.isApproved?'بله':'خیر'}</td><td><button className="text-amber-700" onClick={async()=>{await fetch(`/api/admin/reviews/${r._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isApproved:!r.isApproved})});void load();}}>تغییر وضعیت</button> <button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/reviews/${r._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}</AdminTable></main>; }
