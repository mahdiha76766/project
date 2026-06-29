'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Shield,
  Wallet as WalletIcon,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ShoppingBag,
  TrendingUp,
  History,
  Landmark,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { AdminCard, AdminPageHeader, AdminAlert } from '@/components/admin/ui';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/admin/labels';
import { TRANSACTION_TYPE_LABELS } from '@/lib/dashboard/labels';

type Summary = {
  user: { name: string; mobile: string; email?: string; role: string; createdAt: string };
  wallet?: { availableBalance: number; blockedBalance: number };
  orders: Array<{ _id: string; totalAmount: number; orderStatus: string; paymentStatus: string; createdAt: string }>;
  transactions: Array<{
    transactionId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
  }>;
  payments: Array<{
    resNum: string;
    amount: number;
    status: string;
    provider: string;
    invoiceNumber: string;
    refNum?: string;
    createdAt: string;
  }>;
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manual wallet action form states
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/users/${params.id}/summary`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'خطا در دریافت اطلاعات کاربر');
      setData(d);
    } catch (e: any) {
      setError(e.message || 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      void loadData();
    }
  }, [params.id]);

  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setFormMessage({ type: 'error', text: 'لطفاً یک مبلغ معتبر و بزرگتر از صفر وارد کنید.' });
      return;
    }

    if (actionType === 'withdraw' && data?.wallet && data.wallet.availableBalance < parsedAmount) {
      setFormMessage({ type: 'error', text: 'مبلغ درخواستی برای کسر، بیشتر از موجودی قابل استفاده کاربر است.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          amount: parsedAmount,
          description: description.trim()
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'عملیات مالی ناموفق بود');

      setFormMessage({ type: 'success', text: resData.message || 'عملیات با موفقیت ثبت شد.' });
      setAmount('');
      setDescription('');
      void loadData(); // Reload stats and history
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message || 'خطایی رخ داد' });
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
          <ArrowRight size={16} />
          بازگشت به مدیریت کاربران
        </Link>
        <AdminAlert tone="error">{error}</AdminAlert>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        <p className="text-slate-500 font-bold">در حال بارگذاری جزئیات کامل کاربر...</p>
      </div>
    );
  }

  const creditTypes = new Set(['DEPOSIT', 'REFUND', 'CASHBACK', 'GIFT', 'TRANSFER_IN', 'RELEASE']);

  return (
    <main className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AdminPageHeader
          title={`جزئیات و امور مالی کاربر: ${data.user.name || 'بدون نام'}`}
          description="مشاهده تراکنش‌ها، موجودی کیف پول، سوابق سفارشات و اعمال شارژ/کسر دستی موجودی"
        />
        <Link
          href="/admin/users"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowRight size={16} />
          لیست کاربران
        </Link>
      </div>

      {/* Stats and Info Grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* User Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <UserIcon size={20} />
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-sm">{data.user.name || 'نام کاربری ثبت نشده'}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">نقش: {data.user.role}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400" />
              <span className="font-bold">موبایل:</span>
              <span className="font-mono text-slate-800">{data.user.mobile}</span>
            </div>
            {data.user.email ? (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span className="font-bold">ایمیل:</span>
                <span className="font-mono text-slate-800">{data.user.email}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span className="font-bold">تاریخ عضویت:</span>
              <span className="text-slate-800">
                {new Date(data.user.createdAt).toLocaleDateString('fa-IR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-slate-400" />
              <span className="font-bold">سطح دسترسی:</span>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                {data.user.role === 'ADMIN' ? 'مدیر کل' : 'مشتری عادی'}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon size={22} className="opacity-95" />
              <h3 className="font-black text-sm">موجودی کیف پول</h3>
            </div>
            <span className="rounded-md bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm">
              فعال
            </span>
          </div>
          <div className="my-5">
            <p className="text-3xl font-black">
              {(data.wallet?.availableBalance ?? 0).toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal opacity-90">ریال</span>
            </p>
            <p className="text-xs opacity-90 mt-1 font-bold">
              معادل: {Math.floor((data.wallet?.availableBalance ?? 0) / 10).toLocaleString('fa-IR')} ریال
            </p>
          </div>
          <div className="border-t border-white/20 pt-2 text-xs opacity-95 flex items-center justify-between">
            <span>موجودی بلوکه (در هولد):</span>
            <span className="font-black font-mono">{(data.wallet?.blockedBalance ?? 0).toLocaleString('fa-IR')} ریال</span>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="flex h-10 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <TrendingUp size={18} />
            </span>
            <h3 className="font-black text-slate-800 text-sm">خلاصه فعالیت‌ها</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 my-auto py-2">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[11px] text-slate-500 font-bold">تعداد کل سفارشات</p>
              <p className="mt-1.5 text-xl font-black text-slate-800">{data.orders.length.toLocaleString('fa-IR')}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-[11px] text-slate-500 font-bold">تعداد تراکنش‌های مالی</p>
              <p className="mt-1.5 text-xl font-black text-slate-800">{data.transactions.length.toLocaleString('fa-IR')}</p>
            </div>
          </div>
          <div className="text-center">
            <Link
              href={`/admin/orders?userId=${params.id}`}
              className="text-xs font-black text-amber-700 hover:underline"
            >
              مشاهده فیلتر شده سفارشات این کاربر ←
            </Link>
          </div>
        </div>
      </div>

      {/* Manual Wallet Operations & Transaction History */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet Adjustment Panel */}
        <div className="lg:col-span-1">
          <AdminCard title="تغییر دستی موجودی کیف پول">
            <form onSubmit={handleWalletAction} className="space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
                    actionType === 'deposit'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <PlusCircle size={14} />
                  شارژ (واریز دستی)
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('withdraw')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
                    actionType === 'withdraw'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <MinusCircle size={14} />
                  کاهش موجودی (برداشت)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">مبلغ مورد نظر (به ریال):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="مثال: ۵۰۰۰۰۰"
                    className="h-11 w-full rounded-xl border border-slate-200 pr-3 pl-12 text-sm outline-none font-bold text-slate-800 focus:border-amber-500"
                    required
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ریال</span>
                </div>
                {amount ? (
                  <p className="text-[10px] text-slate-500 font-bold mt-1 pr-1">
                    معادل: {Math.floor(Number(amount) / 10).toLocaleString('fa-IR')} ریال
                  </p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">بابت / توضیحات تراکنش:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="علت تغییر موجودی را بنویسید (مثال: جایزه وفاداری، تصحیح حساب و...)"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-amber-500"
                  required
                />
              </div>

              {formMessage ? (
                <div
                  className={`rounded-xl p-3 text-xs flex gap-2 items-start ${
                    formMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      : 'bg-rose-50 text-rose-800 border border-rose-100'
                  }`}
                >
                  {formMessage.type === 'success' ? (
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <p className="font-bold leading-5">{formMessage.text}</p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full h-11 rounded-xl text-sm font-black text-white transition flex items-center justify-center gap-1.5 shadow-md ${
                  actionType === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 disabled:bg-emerald-400'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 disabled:bg-rose-400'
                }`}
              >
                {submitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : actionType === 'deposit' ? (
                  'اعمال شارژ دستی'
                ) : (
                  'کسر از موجودی کاربر'
                )}
              </button>
            </form>
          </AdminCard>
        </div>

        {/* Detailed Transactions History */}
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="تراکنش‌های کیف پول با ریز جزئیات">
            {data.transactions.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400 font-bold">هیچ تراکنش ثبت‌شده‌ای برای این کاربر یافت نشد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-xs">
                  <thead className="text-slate-500 bg-slate-50">
                    <tr className="text-right [&>th]:px-2.5 [&>th]:py-2.5 border-b">
                      <th>شناسه تراکنش</th>
                      <th>نوع</th>
                      <th>مبلغ</th>
                      <th>موجودی قبل</th>
                      <th>موجودی بعد</th>
                      <th>بابت / توضیحات</th>
                      <th>تاریخ ثبت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {data.transactions.map((t) => {
                      const isCredit = creditTypes.has(t.type);
                      return (
                        <tr key={t.transactionId} className="[&>td]:px-2.5 [&>td]:py-3 hover:bg-slate-50/50">
                          <td className="font-mono font-bold text-slate-800">{t.transactionId}</td>
                          <td>
                            <span
                              className={`rounded-md px-2 py-0.5 font-black text-[10px] ${
                                isCredit
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-800 border border-rose-100'
                              }`}
                            >
                              {TRANSACTION_TYPE_LABELS[t.type] || t.type}
                            </span>
                          </td>
                          <td className={`font-black text-right ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {isCredit ? '+' : '-'}{t.amount.toLocaleString('fa-IR')}
                          </td>
                          <td className="font-mono text-slate-500">{t.balanceBefore.toLocaleString('fa-IR')}</td>
                          <td className="font-mono font-bold text-slate-800">{t.balanceAfter.toLocaleString('fa-IR')}</td>
                          <td className="max-w-[150px] font-bold text-slate-600 truncate" title={t.description}>
                            {t.description || '—'}
                          </td>
                          <td className="whitespace-nowrap text-slate-500">
                            {new Date(t.createdAt).toLocaleString('fa-IR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </div>
      </div>

      {/* Orders and Payments List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders Card */}
        <AdminCard title="تاریخچه سفارش‌ها">
          {data.orders.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400 font-bold">هیچ سفارشی از این کاربر ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[450px] text-xs">
                <thead className="text-slate-500 bg-slate-50 border-b">
                  <tr className="text-right [&>th]:px-2.5 [&>th]:py-2.5">
                    <th>شناسه سفارش</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                    <th>پرداخت</th>
                    <th>تاریخ ثبت</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {data.orders.map((o) => (
                    <tr key={o._id} className="[&>td]:px-2.5 [&>td]:py-3 hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-slate-800">#{o._id.slice(-8)}</td>
                      <td className="font-black">{o.totalAmount.toLocaleString('fa-IR')} ریال</td>
                      <td>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            o.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800'
                              : o.paymentStatus === 'FAILED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                        </span>
                      </td>
                      <td className="text-slate-500">{new Date(o.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        {/* Recent Payments Card */}
        <AdminCard title="رسیدگی و تراکنش‌های بانکی / کارت به کارت">
          {data.payments.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-400 font-bold">هیچ پرداخت یا بارگذاری رسیدی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[450px] text-xs">
                <thead className="text-slate-500 bg-slate-50 border-b">
                  <tr className="text-right [&>th]:px-2.5 [&>th]:py-2.5">
                    <th>کد مرجع پرداخت</th>
                    <th>درگاه / روش</th>
                    <th>مبلغ</th>
                    <th>کد پیگیری بانکی</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {data.payments.map((p) => (
                    <tr key={p.resNum} className="[&>td]:px-2.5 [&>td]:py-3 hover:bg-slate-50/50">
                      <td className="font-mono font-bold text-slate-800">{p.resNum}</td>
                      <td>
                        <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                          {p.provider === 'CARD_TO_CARD' ? 'کارت به کارت' : p.provider}
                        </span>
                      </td>
                      <td className="font-black text-slate-800">{p.amount.toLocaleString('fa-IR')} ریال</td>
                      <td className="font-mono text-slate-600">{p.refNum || '—'}</td>
                      <td>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                            p.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800'
                              : p.status === 'FAILED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {p.status === 'PAID' ? 'پرداخت شده' : p.status === 'FAILED' ? 'ناموفق / رد' : 'در انتظار'}
                        </span>
                      </td>
                      <td className="text-slate-500">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </main>
  );
}
