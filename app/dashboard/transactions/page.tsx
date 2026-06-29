'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading, DashPageHeader } from '@/components/shop/DashboardUI';
import { formatDashCurrency, formatDashDateTime, shortPaymentRef } from '@/lib/dashboard/formats';
import { TRANSACTION_TYPE_LABELS, transactionTypeOptions } from '@/lib/dashboard/labels';

type Tx = {
  transactionId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  isCardToCard?: boolean;
  receiptStatus?: string;
  invoiceNumber?: string;
  relatedUser?: { name: string; mobile: string } | null;
};

const creditTypes = new Set(['DEPOSIT', 'REFUND', 'CASHBACK', 'GIFT', 'TRANSFER_IN', 'RELEASE']);

const typeTone = (type: string): 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'slate' => {
  if (type.startsWith('CARD_TO_CARD')) return 'sky';
  if (creditTypes.has(type)) return 'emerald';
  if (type === 'ORDER_PAYMENT') return 'rose';
  if (type === 'HOLD' || type === 'RELEASE') return 'amber';
  if (type === 'TRANSFER_OUT') return 'violet';
  return 'slate';
};

export default function TransactionsPage() {
  const [items, setItems] = useState<Tx[]>([]);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (type) q.set('type', type);
      if (search) q.set('search', search);
      q.set('limit', '50');
      const res = await fetch(`/api/finance/my-transactions?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div>
      <DashPageHeader title="تراکنش‌های مالی" subtitle="تاریخچه شارژ، مصرف و انتقال‌های کیف پول" />

      <DashCard title="فیلتر تراکنش‌ها">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در کد یا توضیح"
              className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 pr-10 pl-3"
            >
              <option value="">همه انواع تراکنش</option>
              <option value="CARD_TO_CARD">کارت به کارت</option>
              {transactionTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button onClick={load} className="h-11 rounded-xl bg-amber-600 font-bold text-white transition hover:bg-amber-700">
            اعمال فیلتر
          </button>
        </div>
      </DashCard>

      <DashCard title="لیست تراکنش‌ها">
        {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length === 0 ? (
          <DashEmpty text="تراکنشی یافت نشد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="text-right [&>th]:px-3 [&>th]:py-3">
                  <th>کد</th>
                  <th>نوع</th>
                  <th>مبلغ</th>
                  <th>موجودی پس از تراکنش</th>
                  <th>توضیح</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((tx) => {
                  const isCredit = creditTypes.has(tx.type) || tx.type.startsWith('CARD_TO_CARD');
                  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <tr key={tx.transactionId} className="[&>td]:px-3 [&>td]:py-3">
                      <td>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                          {shortPaymentRef(tx.transactionId)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${tx.isCardToCard ? 'bg-sky-100 text-sky-700' : isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            <Icon size={14} />
                          </span>
                          <DashBadge label={TRANSACTION_TYPE_LABELS[tx.type] || tx.type} tone={typeTone(tx.type)} />
                        </div>
                      </td>
                      <td className={`font-black ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCredit ? '+' : '-'}{formatDashCurrency(tx.amount)}
                      </td>
                      <td>{tx.balanceAfter > 0 ? formatDashCurrency(tx.balanceAfter) : '—'}</td>
                      <td className="max-w-[260px] text-slate-600">
                        <div className="font-bold text-slate-800">{tx.description || '-'}</div>
                        {tx.relatedUser ? (
                          <div className="mt-1 text-[11px] text-slate-500 bg-slate-100 rounded-md px-2 py-0.5 inline-block">
                            {tx.type === 'TRANSFER_OUT' ? 'به حساب: ' : 'از حساب: '}
                            <span className="font-black text-slate-700">{tx.relatedUser.name || tx.relatedUser.mobile}</span>
                            {tx.relatedUser.name ? ` (${tx.relatedUser.mobile})` : ''}
                          </div>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap text-slate-600">{formatDashDateTime(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>
    </div>
  );
}
