'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Landmark, Receipt, Upload, Download, Eye, Wallet } from 'lucide-react';
import { toPng } from 'html-to-image';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading, DashPageHeader } from '@/components/shop/DashboardUI';
import { CardToCardPaymentPanel } from '@/components/shop/checkout/CardToCardPaymentPanel';
import { formatDashCurrency, formatDashDateTime, formatInvoiceNumber } from '@/lib/dashboard/formats';
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS, RECEIPT_STATUS_LABELS } from '@/lib/dashboard/labels';
import { PaymentReceiptCard, type ReceiptPayload } from '@/components/shop/PaymentReceiptCard';

type Invoice = {
  invoiceNumber: string;
  type: string;
  status: string;
  total: number;
  createdAt: string;
  paymentMethod?: string;
  receiptStatus?: string | null;
  receiptId?: string | null;
  receiptImageUrl?: string | null;
  receiptRejectCount?: number;
};

type BankInfo = {
  enabled: boolean;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  instructions: string;
};

const statusTone = (status: string): 'amber' | 'emerald' | 'rose' | 'slate' | 'violet' => {
  if (status === 'pending') return 'amber';
  if (status === 'paid') return 'emerald';
  if (status === 'cancelled' || status === 'refunded') return 'rose';
  if (status === 'draft') return 'slate';
  return 'violet';
};

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [wallet, setWallet] = useState({ availableBalance: 0, blockedBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState('');
  const [payingWithWallet, setPayingWithWallet] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState('');
  const [receiptFiles, setReceiptFiles] = useState<Record<string, File | null>>({});
  const [receiptData, setReceiptData] = useState<ReceiptPayload | null>(null);
  const [downloading, setDownloading] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [invRes, bankRes, walletRes] = await Promise.all([
        fetch('/api/invoices/my'),
        fetch('/api/card-to-card/info'),
        fetch('/api/wallet').then((r) => r.json()).catch(() => ({ wallet: { availableBalance: 0, blockedBalance: 0 } }))
      ]);
      const data = await invRes.json();
      const bank = await bankRes.json().catch(() => null);
      if (!invRes.ok) throw new Error(data.error);
      setItems(data.invoices || []);
      if (bank) setBankInfo(bank);
      if (walletRes.wallet) setWallet(walletRes.wallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const uploadReceipt = async (invoiceNumber: string) => {
    const file = receiptFiles[invoiceNumber];
    if (!file) {
      alert('لطفاً تصویر رسید را انتخاب کنید');
      return;
    }
    setUploading(invoiceNumber);
    const inv = items.find((i) => i.invoiceNumber === invoiceNumber);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('invoiceNumber', invoiceNumber);
    fd.append('type', inv?.type === 'wallet_topup' ? 'wallet_topup' : 'order');
    const res = await fetch('/api/payment/receipt', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading('');
    if (!res.ok) {
      alert(data.error || 'خطا در آپلود');
      return;
    }
    setExpandedInvoice('');
    setReceiptFiles((p) => ({ ...p, [invoiceNumber]: null }));
    void load();
  };

  const payWithWallet = async (invoiceNumber: string) => {
    if (!confirm('آیا مایل هستید این فاکتور را از طریق موجودی کیف پول خود پرداخت کنید؟')) return;
    setPayingWithWallet(invoiceNumber);
    try {
      const res = await fetch('/api/payment/invoice/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber, method: 'wallet' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در پرداخت');
      alert('پرداخت با موفقیت انجام شد');
      void load();
    } catch (e: any) {
      alert(e.message || 'خطا در پرداخت');
    } finally {
      setPayingWithWallet('');
    }
  };

  const downloadReceipt = async (invoiceNumber: string) => {
    setDownloading(invoiceNumber);
    try {
      const res = await fetch(`/api/payment/receipt?invoiceNumber=${encodeURIComponent(invoiceNumber)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReceiptData(data);
      await new Promise((r) => setTimeout(r, 100));
      if (!receiptRef.current) return;
      const dataUrl = await toPng(receiptRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `receipt-${formatInvoiceNumber(invoiceNumber)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'خطا در دانلود رسید');
    } finally {
      setDownloading('');
      setReceiptData(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invNum = params.get('invoiceNumber');
    if (invNum) {
      setExpandedInvoice(invNum);
    }
  }, [items]);

  return (
    <div>
      <DashPageHeader title="فاکتورهای من" subtitle="پیگیری فاکتورها، پرداخت با کیف پول و وضعیت رسید" />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-600 animate-pulse" />
          <p className="text-sm font-bold text-slate-800">
            موجودی قابل استفاده کیف پول شما: <span className="font-black text-amber-700">{formatDashCurrency(wallet.availableBalance)}</span>
          </p>
        </div>
        <Link href="/dashboard/wallet" className="text-xs font-black text-amber-700 hover:underline">
          + شارژ مستقیم کیف پول
        </Link>
      </div>

      <DashCard title="لیست فاکتورها">
        {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length === 0 ? (
          <DashEmpty text="فاکتوری یافت نشد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="text-right [&>th]:px-3 [&>th]:py-3">
                  <th>شماره فاکتور</th>
                  <th>نوع</th>
                  <th>وضعیت فاکتور</th>
                  <th>رسید C2C</th>
                  <th>مبلغ</th>
                  <th>تاریخ</th>
                  <th>عملیات پرداخت / مشاهده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((inv) => {
                  const isLocked = inv.receiptRejectCount ? inv.receiptRejectCount >= 2 : false;
                  const canPayOrUpload = inv.status === 'pending' && !isLocked && (!inv.receiptStatus || inv.receiptStatus === 'REJECTED');
                  const hasEnoughWallet = wallet.availableBalance >= inv.total;

                  return (
                    <Fragment key={inv.invoiceNumber}>
                      <tr className="[&>td]:px-3 [&>td]:py-3.5">
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                              <Receipt size={14} />
                            </span>
                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-sm font-black text-slate-800">
                              {formatInvoiceNumber(inv.invoiceNumber)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <DashBadge label={INVOICE_TYPE_LABELS[inv.type] || inv.type} tone="sky" />
                        </td>
                        <td>
                          <DashBadge label={isLocked ? "لغو شده / قفل" : INVOICE_STATUS_LABELS[inv.status] || inv.status} tone={isLocked ? "rose" : statusTone(inv.status)} />
                        </td>
                        <td>
                          {isLocked ? (
                            <span className="inline-flex flex-col">
                              <DashBadge label="قفل شده" tone="rose" />
                              <span className="mt-1 text-[10px] text-rose-600 font-bold whitespace-nowrap">تلاش ناموفق بیش از حد</span>
                            </span>
                          ) : inv.receiptStatus ? (
                            <DashBadge
                              label={RECEIPT_STATUS_LABELS[inv.receiptStatus] || inv.receiptStatus}
                              tone={inv.receiptStatus === 'APPROVED' ? 'emerald' : inv.receiptStatus === 'REJECTED' ? 'rose' : 'amber'}
                            />
                          ) : inv.status === 'pending' ? (
                            <span className="text-xs text-slate-400 font-bold">رسید ارسال نشده</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="font-black text-slate-800">{formatDashCurrency(inv.total)}</td>
                        <td className="whitespace-nowrap text-slate-600">{formatDashDateTime(inv.createdAt)}</td>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            {isLocked ? (
                              <span className="text-xs text-rose-600 font-black">⚠️ به علت ۲ بار رد رسید، پرداخت قفل شد</span>
                            ) : canPayOrUpload ? (
                              <>
                                <button
                                  onClick={() => setExpandedInvoice(expandedInvoice === inv.invoiceNumber ? '' : inv.invoiceNumber)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                                >
                                  <Landmark size={14} />
                                  کارت به کارت
                                </button>
                                {hasEnoughWallet ? (
                                  <button
                                    disabled={payingWithWallet === inv.invoiceNumber}
                                    onClick={() => void payWithWallet(inv.invoiceNumber)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-700 shadow-sm disabled:opacity-50"
                                  >
                                    <Wallet size={14} />
                                    {payingWithWallet === inv.invoiceNumber ? '...' : 'پرداخت با کیف پول'}
                                  </button>
                                ) : null}
                              </>
                            ) : null}
                            {inv.receiptImageUrl ? (
                              <a
                                href={inv.receiptImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Eye size={14} />
                                تصویر رسید
                              </a>
                            ) : null}
                            {inv.status === 'paid' ? (
                              <button
                                onClick={() => void downloadReceipt(inv.invoiceNumber)}
                                disabled={downloading === inv.invoiceNumber}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 disabled:opacity-60 transition hover:bg-emerald-100"
                              >
                                <Download size={14} />
                                {downloading === inv.invoiceNumber ? '...' : 'دانلود فیش پرداخت'}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {expandedInvoice === inv.invoiceNumber && canPayOrUpload ? (
                        <tr key={`${inv.invoiceNumber}-expand`}>
                          <td colSpan={7} className="bg-emerald-50/20 px-4 py-4 rounded-b-2xl border-t border-emerald-100">
                            {inv.receiptStatus === 'REJECTED' ? (
                              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-900 text-xs">
                                <p className="font-bold mb-1">❌ رسید قبلی رد شده است</p>
                                لطفاً پس از واریز مجدد مبلغ دقیق فاکتور، رسید بانکی صحیح را در پنل زیر بارگذاری کنید تا مجدداً بررسی شود.
                              </div>
                            ) : null}
                            <CardToCardPaymentPanel
                              bankInfo={bankInfo}
                              amount={inv.total}
                              file={receiptFiles[inv.invoiceNumber] || null}
                              onFileSelect={(f) => setReceiptFiles((p) => ({ ...p, [inv.invoiceNumber]: f }))}
                            />
                            <button
                              onClick={() => void uploadReceipt(inv.invoiceNumber)}
                              disabled={uploading === inv.invoiceNumber}
                              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-800 disabled:opacity-60"
                            >
                              <Upload size={16} />
                              {uploading === inv.invoiceNumber ? 'در حال ارسال...' : 'ارسال رسید برای بررسی مجدد'}
                            </button>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>

      {receiptData ? (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
          <div ref={receiptRef}>
            <PaymentReceiptCard data={receiptData} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
