'use client';

import { useState } from 'react';
import { AdminAlert, AdminCard, AdminPageHeader, AdminPagination, AdminProTable } from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { useAdminList } from '@/hooks/useAdminList';

type Withdrawal = {
  _id: string;
  amount: number;
  status: string;
  user?: { name?: string; mobile?: string };
  createdAt: string;
};

export default function AdminWithdrawalsPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<Withdrawal>('/api/admin/finance/withdrawals');
  const [message, setMessage] = useState('');

  const updateStatus = async (id: string, status: string) => {
    const { ok, error: err } = await adminFetch(`/api/admin/finance/withdrawals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!ok) alert(err);
    else { setMessage('به‌روزرسانی شد'); reload(); }
  };

  return (
    <main className="space-y-6">
      <AdminPageHeader title="درخواست‌های برداشت" description="بررسی و تأیید برداشت‌های کاربران" />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
      <AdminCard title="لیست برداشت‌ها">
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(r) => r._id}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          columns={[
            { id: 'user', header: 'کاربر', accessor: (r) => r.user?.mobile ?? '-' },
            { id: 'amount', header: 'مبلغ', type: 'currency', accessor: (r) => r.amount },
            { id: 'status', header: 'وضعیت', accessor: (r) => r.status },
            { id: 'createdAt', header: 'تاریخ', type: 'date', accessor: (r) => r.createdAt },
            {
              id: 'actions',
              header: 'عملیات',
              render: (r) => (
                <div className="flex gap-2">
                  <button type="button" onClick={() => updateStatus(r._id, 'APPROVED')} className="text-green-700">تأیید</button>
                  <button type="button" onClick={() => updateStatus(r._id, 'REJECTED')} className="text-red-700">رد</button>
                </div>
              )
            }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
