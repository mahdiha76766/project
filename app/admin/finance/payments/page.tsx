'use client';

import { useMemo, useState } from 'react';
import { CreditCard, FileText, Hash, User, Wallet } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPagination,
  AdminProTable,
  SelectInput
} from '@/components/admin/ui';
import { formatInvoiceNumber } from '@/lib/dashboard/formats';
import {
  FINANCE_PAYMENT_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_PROVIDER_LABELS
} from '@/lib/dashboard/labels';
import { useAdminList } from '@/hooks/useAdminList';

type Payment = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  walletAmount: number;
  gatewayAmount: number;
  status: string;
  paymentType: string;
  provider: string;
  refNum?: string;
  userId?: { name?: string; mobile?: string };
  createdAt: string;
  verifiedAt?: string;
};

const statusTone = (status: string) => {
  if (status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'warning' as const;
  if (status === 'FAILED') return 'danger' as const;
  return 'neutral' as const;
};

export default function AdminFinancePaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const listUrl = statusFilter ? `/api/admin/finance/payments?status=${statusFilter}` : '/api/admin/finance/payments';
  const { items, page, setPage, totalPages, total, loading, error } = useAdminList<Payment>(listUrl);

  const stats = useMemo(() => {
    const paid = items.filter((p) => p.status === 'PAID');
    const failed = items.filter((p) => p.status === 'FAILED');
    return {
      paidCount: paid.length,
      paidSum: paid.reduce((s, p) => s + p.amount, 0),
      failedCount: failed.length
    };
  }, [items]);

  return (
    <main>
      <AdminPageHeader
        title="پرداخت‌ها"
        description="پیگیری پرداخت‌های درگاه، کیف پول و کارت به کارت"
      />

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminCard title="پرداخت موفق (صفحه جاری)">
          <p className="text-2xl font-black text-emerald-700">{stats.paidCount.toLocaleString('fa-IR')}</p>
          <p className="mt-1 text-xs text-slate-500">جمع: {stats.paidSum.toLocaleString('fa-IR')} ریال</p>
        </AdminCard>
        <AdminCard title="ناموفق (صفحه جاری)">
          <p className="text-2xl font-black text-rose-700">{stats.failedCount.toLocaleString('fa-IR')}</p>
        </AdminCard>
        <AdminCard title="کل رکوردها">
          <p className="text-2xl font-black text-slate-800">{total.toLocaleString('fa-IR')}</p>
        </AdminCard>
      </div>

      <AdminCard
        title="فیلتر و لیست پرداخت‌ها"
        actions={
          <div className="w-48">
            <SelectInput value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">همه وضعیت‌ها</option>
              {Object.entries(FINANCE_PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectInput>
          </div>
        }
      >
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(r) => r._id}
          columns={[
            {
              id: 'invoiceNumber',
              header: 'شماره فاکتور',
              icon: <Hash className="h-3.5 w-3.5" />,
              render: (r) => (
                <span className="font-mono font-black text-amber-800">{formatInvoiceNumber(r.invoiceNumber)}</span>
              ),
              accessor: (r) => r.invoiceNumber,
              sortable: true,
              searchable: true
            },
            {
              id: 'user',
              header: 'کاربر',
              icon: <User className="h-3.5 w-3.5" />,
              render: (r) => (
                <div>
                  <p className="font-bold">{r.userId?.name || 'کاربر'}</p>
                  <p className="text-xs text-slate-500" dir="ltr">{r.userId?.mobile || '-'}</p>
                </div>
              ),
              accessor: (r) => r.userId?.mobile || r.userId?.name || '',
              searchable: true
            },
            {
              id: 'paymentType',
              header: 'نوع فاکتور',
              icon: <FileText className="h-3.5 w-3.5" />,
              render: (r) => INVOICE_TYPE_LABELS[r.paymentType] || r.paymentType,
              sortable: true
            },
            {
              id: 'amount',
              header: 'مبلغ کل',
              type: 'currency',
              accessor: (r) => r.amount,
              sortable: true
            },
            {
              id: 'walletAmount',
              header: 'کیف پول',
              icon: <Wallet className="h-3.5 w-3.5" />,
              render: (r) => (r.walletAmount > 0 ? `${r.walletAmount.toLocaleString('fa-IR')} ریال` : '-'),
              sortable: true,
              accessor: (r) => r.walletAmount
            },
            {
              id: 'gatewayAmount',
              header: 'مبلغ درگاه / C2C',
              icon: <CreditCard className="h-3.5 w-3.5" />,
              render: (r) => (r.gatewayAmount > 0 ? `${r.gatewayAmount.toLocaleString('fa-IR')} ریال` : '-'),
              sortable: true,
              accessor: (r) => r.gatewayAmount
            },
            {
              id: 'provider',
              header: 'روش پرداخت',
              render: (r) => PAYMENT_PROVIDER_LABELS[r.provider] || r.provider,
              sortable: true
            },
            {
              id: 'status',
              header: 'وضعیت',
              type: 'badge',
              badge: (r) => ({
                label: FINANCE_PAYMENT_STATUS_LABELS[r.status] || r.status,
                tone: statusTone(r.status)
              }),
              sortable: true
            },
            {
              id: 'createdAt',
              header: 'تاریخ ثبت',
              type: 'date',
              accessor: (r) => r.createdAt,
              sortable: true
            },
            {
              id: 'verifiedAt',
              header: 'تاریخ تأیید',
              type: 'date',
              accessor: (r) => r.verifiedAt || r.createdAt,
              sortable: true
            }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
