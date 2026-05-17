'use client';

import { useEffect, useState } from 'react';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { FieldLabel, TextInput } from '@/components/admin/ui/AdminField';
import { AdminTable } from '@/components/admin/ui/AdminTable';

type Ship = { _id:string; code:string; name:string; baseCost:number; estimatedDays:number; cityOnly:boolean; freeAboveAmount:number; isActive:boolean };

export default function AdminShippingPage() {
  const [items, setItems] = useState<Ship[]>([]);
  const [form, setForm] = useState({ id:'', code:'', name:'', baseCost:'', estimatedDays:'1', freeAboveAmount:'0', cityOnly:false, isActive:true });
  const load = async () => setItems((await (await fetch('/api/admin/shipping')).json()).items || []);
  useEffect(()=>{ void load(); },[]);
  const save = async () => { const method=form.id?'PUT':'POST'; const url=form.id?`/api/admin/shipping/${form.id}`:'/api/admin/shipping'; await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, baseCost:Number(form.baseCost||0), estimatedDays:Number(form.estimatedDays||1), freeAboveAmount:Number(form.freeAboveAmount||0)})}); setForm({ id:'', code:'', name:'', baseCost:'', estimatedDays:'1', freeAboveAmount:'0', cityOnly:false, isActive:true }); void load(); };

  return <main className="space-y-6"><h1 className="text-2xl font-black text-slate-900">مدیریت روش‌های ارسال</h1><AdminCard title={form.id?'ویرایش روش ارسال':'ایجاد روش ارسال'}><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div><FieldLabel text="کد"/><TextInput value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/></div><div><FieldLabel text="نام"/><TextInput value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div><FieldLabel text="هزینه پایه"/><TextInput value={form.baseCost} onChange={e=>setForm({...form,baseCost:e.target.value})}/></div><div><FieldLabel text="زمان تحویل (روز)"/><TextInput value={form.estimatedDays} onChange={e=>setForm({...form,estimatedDays:e.target.value})}/></div><div><FieldLabel text="ارسال رایگان از مبلغ"/><TextInput value={form.freeAboveAmount} onChange={e=>setForm({...form,freeAboveAmount:e.target.value})}/></div><label className="inline-flex items-center gap-2 pt-8 text-sm"><input type="checkbox" checked={form.cityOnly} onChange={e=>setForm({...form,cityOnly:e.target.checked})}/> فقط شهری</label><label className="inline-flex items-center gap-2 pt-8 text-sm"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})}/> فعال</label></div><button className="mt-4 h-11 rounded-xl bg-amber-600 px-4 text-white" onClick={save}>{form.id?'ذخیره تغییرات':'ایجاد روش'}</button></AdminCard>
  <AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-right"><th>کد</th><th>نام</th><th>هزینه</th><th>زمان</th><th>شرط ارسال رایگان</th><th>وضعیت</th><th>عملیات</th></tr>}>
    {items.map(s => <tr key={s._id} className="[&>td]:px-4 [&>td]:py-3"><td className="font-bold">{s.code}</td><td>{s.name}</td><td>{s.baseCost.toLocaleString('fa-IR')}</td><td>{s.estimatedDays} روز</td><td>{s.freeAboveAmount ? s.freeAboveAmount.toLocaleString('fa-IR') : '-'}</td><td><span className={`rounded-full px-2 py-1 text-xs ${s.isActive?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600'}`}>{s.isActive?'فعال':'غیرفعال'}</span></td><td className="space-x-3 space-x-reverse"><button className="text-amber-700" onClick={()=>setForm({id:s._id, code:s.code, name:s.name, baseCost:String(s.baseCost), estimatedDays:String(s.estimatedDays), freeAboveAmount:String(s.freeAboveAmount||0), cityOnly:s.cityOnly, isActive:s.isActive})}>ویرایش</button><button className="text-red-600" onClick={async()=>{await fetch(`/api/admin/shipping/${s._id}`,{method:'DELETE'});void load();}}>حذف</button></td></tr>)}
  </AdminTable></main>;
}
