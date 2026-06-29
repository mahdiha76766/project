'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { USER_ROLES } from '@/constants/roles';
import { AdminPageHeader, AdminTable } from '@/components/admin/ui';
import { SelectInput } from '@/components/admin/ui/AdminField';

type User = { _id: string; name: string; mobile: string; role: string; isBlocked: boolean };

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);

  const load = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main>
      <AdminPageHeader title="مدیریت کاربران" description="مشاهده تاریخچه خرید و تراکنش‌های هر کاربر" />
      <AdminTable
        head={
          <tr className="text-right [&>th]:px-4 [&>th]:py-3">
            <th>نام</th><th>موبایل</th><th>نقش</th><th>مسدود</th><th>عملیات</th>
          </tr>
        }
      >
        {items.map((u) => (
          <tr key={u._id} className="[&>td]:px-4 [&>td]:py-3">
            <td>{u.name}</td>
            <td>{u.mobile}</td>
            <td className="min-w-44">
              <SelectInput
                value={u.role}
                onChange={async (e) => {
                  await fetch(`/api/admin/users/${u._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: e.target.value })
                  });
                  void load();
                }}
              >
                {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </SelectInput>
            </td>
            <td>
              <input
                type="checkbox"
                checked={u.isBlocked}
                onChange={async (e) => {
                  await fetch(`/api/admin/users/${u._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isBlocked: e.target.checked })
                  });
                  void load();
                }}
              />
            </td>
            <td>
              <Link href={`/admin/users/${u._id}`} className="font-bold text-amber-700">تاریخچه</Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
