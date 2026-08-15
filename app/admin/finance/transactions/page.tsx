'use client';

import { AdminCard, AdminPageHeader, AdminPagination, AdminProTable } from '@/components/admin/ui';
import { useAdminList } from '@/hooks/useAdminList';

type Tx = {
  transactionId: string;
  type: string;
  amount: number;
  user?: { name?: string; mobile?: string };
  balanceAfter: number;
  createdAt: string;
};

export default function AdminFinanceTransactionsPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error } = useAdminList<Tx>('/api/finance/transactions');

  return (
    <main className="space-y-6">
      <AdminPageHeader title="تراکنش‌های مالی" description="مشاهده تمام تراکنش‌های کیف پول" />
      {error ? <p className="text-red-600">{error}</p> : null}
      <AdminCard title="لیست تراکنش‌ها">
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(r) => r.transactionId}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          columns={[
            { id: 'user', header: 'کاربر', accessor: (r) => r.user?.mobile || r.user?.name || '-' },
            { id: 'transactionId', header: 'شناسه', accessor: (r) => r.transactionId },
            { id: 'type', header: 'نوع', accessor: (r) => r.type },
            { id: 'amount', header: 'مبلغ', type: 'currency', accessor: (r) => r.amount },
            { id: 'balanceAfter', header: 'موجودی بعد', type: 'currency', accessor: (r) => r.balanceAfter },
            { id: 'createdAt', header: 'تاریخ', type: 'date', accessor: (r) => r.createdAt }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
