'use client';

import { useEffect, useState } from 'react';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { FieldLabel, TextArea, TextInput } from '@/components/admin/ui/AdminField';
import { AdminTable } from '@/components/admin/ui/AdminTable';

type Setting = { _id: string; key: string; value: unknown };

export default function AdminSettingsPage() {
  const [items, setItems] = useState<Setting[]>([]);
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('{}');
  const [message, setMessage] = useState('');

  const load = async () => setItems((await (await fetch('/api/admin/settings')).json()).items || []);
  useEffect(() => { void load(); }, []);

  const save = async () => {
    setMessage('در حال ذخیره...');
    try {
      const parsed = JSON.parse(value);
      const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: keyName, value: parsed }) });
      setMessage(res.ok ? 'ذخیره شد' : 'ذخیره ناموفق بود');
      void load();
    } catch {
      setMessage('JSON نامعتبر است');
    }
  };

  return <main className="space-y-6"><h1 className="text-2xl font-black">تنظیمات</h1><AdminCard title="ثبت تنظیمات کلیدی"><div className="grid gap-4 md:grid-cols-2"><div><FieldLabel text="کلید"/><TextInput value={keyName} onChange={(e)=>setKeyName(e.target.value)} /></div><div className="md:col-span-2"><FieldLabel text="مقدار (JSON)"/><TextArea value={value} onChange={(e)=>setValue(e.target.value)} /></div></div><button onClick={save} className="mt-4 h-11 rounded-xl bg-amber-600 px-4 text-white">ذخیره</button><p className="mt-2 text-sm">{message}</p></AdminCard>
  <AdminTable head={<tr className="[&>th]:px-4 [&>th]:py-3 text-right"><th>کلید</th><th>مقدار</th></tr>}>{items.map(x => <tr key={x._id} className="[&>td]:px-4 [&>td]:py-3"><td>{x.key}</td><td><pre className="max-w-xl overflow-x-auto text-xs">{JSON.stringify(x.value)}</pre></td></tr>)}</AdminTable></main>;
}
