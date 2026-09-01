'use client';

import { useState } from 'react';
import { AdminAlert, AdminCard, AdminPageHeader, AdminPagination, AdminProTable } from '@/components/admin/ui';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useAdminList } from '@/hooks/useAdminList';
import { adminFetch } from '@/lib/admin/client';
import { useAdminToast } from '@/components/admin/AdminToast';
import { SelectInput } from '@/components/admin/ui';

type Message = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'NEW' | 'READ';
  createdAt: string;
};

export default function AdminMessagesPage() {
  const [status, setStatus] = useState('');
  const endpoint = status ? `/api/admin/messages?status=${status}` : '/api/admin/messages';
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<Message>(endpoint);
  const { notify } = useAdminToast();
  const [pending, setPending] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);

  async function mark(item: Message, next: 'NEW' | 'READ') {
    const { ok, error: saveError } = await adminFetch(`/api/admin/messages/${item._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    });
    if (!ok) notify(saveError, 'error');
    else {
      notify(next === 'READ' ? 'پیام خوانده شد.' : 'پیام به خوانده‌نشده برگشت.');
      reload();
    }
  }

  return (
    <main className="space-y-6">
      <AdminPageHeader title="پیام‌های تماس" description="پیام‌های فرم تماس سایت." />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      <div className="max-w-xs">
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          <option value="NEW">خوانده‌نشده</option>
          <option value="READ">خوانده‌شده</option>
        </SelectInput>
      </div>
      <AdminCard title="لیست پیام‌ها">
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(row) => row._id}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          emptyMessage="پیامی ثبت نشده است."
          columns={[
            { id: 'name', header: 'نام', sortable: true },
            { id: 'email', header: 'ایمیل', type: 'ltr' },
            { id: 'phone', header: 'تلفن' },
            { id: 'subject', header: 'موضوع' },
            {
              id: 'message',
              header: 'متن',
              render: (row) => <span className="line-clamp-2 max-w-sm text-xs leading-6">{row.message}</span>
            },
            {
              id: 'status',
              header: 'وضعیت',
              type: 'badge',
              accessor: (row) => row.status,
              badge: (row) => ({
                label: row.status === 'NEW' ? 'جدید' : 'خوانده‌شده',
                tone: row.status === 'NEW' ? 'warning' : 'success'
              })
            },
            { id: 'createdAt', header: 'تاریخ', type: 'date', sortable: true }
          ]}
          actions={[
            { id: 'read', label: 'خوانده شد', hidden: (row) => row.status === 'READ', onClick: (row) => void mark(row, 'READ') },
            { id: 'unread', label: 'خوانده‌نشده', hidden: (row) => row.status === 'NEW', onClick: (row) => void mark(row, 'NEW') },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (row) => setPending(row) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
      <AdminConfirmDialog
        open={Boolean(pending)}
        title="حذف پیام"
        description="این پیام برای همیشه حذف می‌شود."
        loading={busy}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setBusy(true);
          const { ok, error: deleteError } = await adminFetch(`/api/admin/messages/${pending._id}`, { method: 'DELETE' });
          setBusy(false);
          if (!ok) notify(deleteError, 'error');
          else {
            notify('پیام حذف شد.');
            setPending(null);
            reload();
          }
        }}
      />
    </main>
  );
}
