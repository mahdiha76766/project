'use client';

import { formatDashCurrency, formatDashDateTime, formatInvoiceNumber } from '@/lib/dashboard/formats';
import { INVOICE_TYPE_LABELS } from '@/lib/dashboard/labels';

export type ReceiptPayload = {
  payment?: {
    invoiceNumber: string;
    amount: number;
    status: string;
    paymentType: string;
    verifiedAt?: string;
  };
  invoice?: {
    total: number;
    type: string;
    buyerInfo?: { name?: string; mobile?: string };
  };
};

export function PaymentReceiptCard({ data, id }: { data: ReceiptPayload; id?: string }) {
  const payment = data.payment;
  const invoice = data.invoice;

  return (
    <div
      id={id}
      className="w-[360px] rounded-2xl border-2 border-emerald-200 bg-white p-6 text-right font-sans"
      dir="rtl"
    >
      <div className="border-b border-slate-100 pb-4 text-center">
        <p className="text-xs font-bold text-emerald-700">رسید پرداخت</p>
        <p className="mt-1 text-lg font-black text-slate-900">فروشگاه آنلاین</p>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">شماره فاکتور</span>
          <span className="font-mono text-xl font-black text-amber-700">
            {formatInvoiceNumber(payment?.invoiceNumber)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">مبلغ</span>
          <span className="font-black text-emerald-700">
            {formatDashCurrency(payment?.amount ?? invoice?.total)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">نوع</span>
          <span className="font-bold text-slate-700">
            {INVOICE_TYPE_LABELS[payment?.paymentType ?? invoice?.type ?? ''] || payment?.paymentType}
          </span>
        </div>
        {payment?.verifiedAt ? (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">تاریخ</span>
            <span className="font-bold text-slate-700">{formatDashDateTime(payment.verifiedAt)}</span>
          </div>
        ) : null}
        {invoice?.buyerInfo?.name ? (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">خریدار</span>
            <span className="font-bold text-slate-700">{invoice.buyerInfo.name}</span>
          </div>
        ) : null}
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-[10px] leading-5 text-slate-400">
        این رسید به صورت الکترونیکی صادر شده و فاقد مهر و امضا معتبر است.
      </p>
    </div>
  );
}
