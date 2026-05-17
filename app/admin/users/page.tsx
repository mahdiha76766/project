'use client';
import { useEffect, useState } from 'react';
import { USER_ROLES } from '@/constants/roles';
import { AdminTable } from '@/components/admin/ui/AdminTable';
import { SelectInput } from '@/components/admin/ui/AdminField';

type User={_id:string;name:string;mobile:string;role:string;isBlocked:boolean};
export default function AdminUsersPage(){const [items,setItems]=useState<User[]>([]); const load=async()=>setItems((await (await fetch('/api/admin/users')).json()).items||[]); useEffect(()=>{void load();},[]);
return <main className="space-y-6"><h1 className="text-2xl font-black">مدیریت کاربران</h1><AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 text-right"><th>نام</th><th>موبایل</th><th>نقش</th><th>مسدود</th></tr>}>{items.map(u=><tr key={u._id} className="[&>td]:px-4 [&>td]:py-3"><td>{u.name}</td><td>{u.mobile}</td><td className="min-w-44"><SelectInput value={u.role} onChange={async(e)=>{await fetch(`/api/admin/users/${u._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:e.target.value})});void load();}}>{USER_ROLES.map(r=><option key={r} value={r}>{r}</option>)}</SelectInput></td><td><input type="checkbox" checked={u.isBlocked} onChange={async(e)=>{await fetch(`/api/admin/users/${u._id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isBlocked:e.target.checked})});void load();}}/></td></tr>)}</AdminTable></main>; }
