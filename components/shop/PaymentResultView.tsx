'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  CheckCircle2,
  XCircle,
  Hash,
  FileText,
  ShoppingBag,
  Download,
  Home,
  Wallet
} from 'lucide-react';
import { formatDashCurrency, formatDashDateTime, formatInvoiceNumber } from '@/lib/dashboard/formats';
import { PAYMENT_RESULT_STATUS_LABELS, INVOICE_TYPE_LABELS } from '@/lib/dashboard/labels';
import { PaymentReceiptCard, type ReceiptPayload } from '@/components/shop/PaymentReceiptCard';

type Params = {
  orderId?: string;
  status?: string;
  invoiceNumber?: string;
  message?: string;
};

export function PaymentResultView({ params }: { params: Params }) {
  const success = params.status === 'paid';
  const statusLabel = PAYMENT_RESULT_STATUS_LABELS[params.status ?? ''] || params.status || 'نامشخص';
  const [details, setDetails] = useState<ReceiptPayload | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const invoiceNumber = params.invoiceNumber;

  useEffect(() => {
    if (!invoiceNumber || !success) return;
    void fetch(`/api/payment/receipt?invoiceNumber=${encodeURIComponent(invoiceNumber)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setDetails(data); })
      .catch(() => undefined);
  }, [invoiceNumber, success]);

  const amount = details?.payment?.amount ?? details?.invoice?.total;
  const paymentType = details?.payment?.paymentType;
  const verifiedAt = details?.payment?.verifiedAt;

  const downloadReceiptImage = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `receipt-${formatInvoiceNumber(invoiceNumber)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-lg p-4 md:p-6">
      <div className={`overflow-hidden rounded-3xl border shadow-lg ${success ? 'border-emerald-200 bg-white' : 'border-rose-200 bg-white'}`}>
        <div className={`px-6 py-8 text-center ${success ? 'bg-gradient-to-b from-emerald-50 to-white' : 'bg-gradient-to-b from-rose-50 to-white'}`}>
          <span className={`mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full ${success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {success ? <CheckCircle2 size={44} /> : <XCircle size={44} />}
          </span>
          <h1 className="mt-5 text-2xl font-black text-slate-900">
            {success ? 'پرداخت با موفقیت انجام شد' : 'پرداخت انجام نشد'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {success ? 'تراکنش شما ثبت شد.' : 'در صورت کسر وجه، طی ۷۲ ساعت به حساب شما بازمی‌گردد.'}
          </p>
        </div>

        <div className="space-y-3 px-6 pb-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">وضعیت</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {statusLabel}
              </span>
            </div>

            {amount ? (
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">مبلغ</span>
                <span className="font-black text-slate-900">{formatDashCurrency(amount)}</span>
              </div>
            ) : null}

            {paymentType ? (
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">نوع</span>
                <span className="font-bold text-slate-700">{INVOICE_TYPE_LABELS[paymentType] || paymentType}</span>
              </div>
            ) : null}

            {verifiedAt ? (
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">زمان</span>
                <span className="font-bold text-slate-700">{formatDashDateTime(verifiedAt)}</span>
              </div>
            ) : null}
          </div>

          {invoiceNumber ? (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                <Hash size={18} />
              </span>
              <div className="flex-1">
                <p className="text-xs text-amber-700">شماره فاکتور</p>
                <p className="font-mono text-2xl font-black tracking-widest text-amber-900">
                  {formatInvoiceNumber(invoiceNumber)}
                </p>
              </div>
            </div>
          ) : null}

          {params.message ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {decodeURIComponent(params.message)}
            </p>
          ) : null}

          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            {success ? (
              <>
                <Link href="/dashboard/orders" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white transition hover:bg-amber-700">
                  <ShoppingBag size={16} />
                  سفارش‌های من
                </Link>
                <Link href="/dashboard/invoices" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 font-bold text-slate-800 transition hover:bg-slate-50">
                  <FileText size={16} />
                  فاکتورها
                </Link>
                {invoiceNumber && details ? (
                  <button
                    type="button"
                    onClick={downloadReceiptImage}
                    disabled={downloading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 sm:col-span-2"
                  >
                    <Download size={16} />
                    {downloading ? 'در حال آماده‌سازی...' : 'دانلود رسید (تصویر)'}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/checkout" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white">
                  تلاش مجدد
                </Link>
                <Link href="/dashboard/wallet" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border font-bold text-slate-800">
                  <Wallet size={16} />
                  کیف پول
                </Link>
              </>
            )}
            <Link href="/" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border font-bold text-slate-700 ${success ? 'sm:col-span-2' : ''}`}>
              <Home size={16} />
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>

      {success && details ? (
        <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
          <div ref={receiptRef}>
            <PaymentReceiptCard data={details} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
