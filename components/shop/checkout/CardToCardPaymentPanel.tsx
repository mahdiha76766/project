'use client';

import { useRef, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';

type BankInfo = {
  enabled: boolean;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  instructions: string;
};

type Props = {
  bankInfo: BankInfo | null;
  amount?: number;
  onFileSelect: (file: File | null) => void;
  file: File | null;
  error?: string;
};

export function CardToCardPaymentPanel({ bankInfo, amount, onFileSelect, file, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState('');

  const pickFile = (f: File | null) => {
    setLocalError('');
    if (!f) {
      onFileSelect(null);
      return;
    }
    const ok = ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type);
    if (!ok) {
      setLocalError('فقط فایل JPEG و PNG مجاز است');
      onFileSelect(null);
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setLocalError('حداکثر حجم فایل ۴ مگابایت است');
      onFileSelect(null);
      return;
    }
    onFileSelect(f);
  };

  if (!bankInfo?.enabled) {
    return (
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
        پرداخت کارت به کارت موقتاً غیرفعال است. لطفاً از کیف پول استفاده کنید.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="text-sm font-bold text-emerald-900">راهنمای پرداخت کارت به کارت</p>
      <p className="text-xs leading-6 text-emerald-800">{bankInfo.instructions}</p>

      {amount ? (
        <p className="text-sm font-black text-slate-800">
          مبلغ قابل پرداخت: <span className="text-emerald-700">{amount.toLocaleString('fa-IR')} تومان</span>
        </p>
      ) : null}

      <div className="grid gap-2 rounded-xl bg-white p-3 text-sm">
        {bankInfo.bankName ? (
          <p><span className="text-slate-500">بانک:</span> <span className="font-bold">{bankInfo.bankName}</span></p>
        ) : null}
        <p><span className="text-slate-500">نام صاحب حساب:</span> <span className="font-bold">{bankInfo.accountHolder || '—'}</span></p>
        <p  className="font-mono  "><span className="text-slate-500 font-sans text-right" dir="rtl">شماره کارت:</span> {bankInfo.cardNumber || '—'}</p>
        <p   className="font-mono  "><span className="text-slate-500 font-sans text-right" dir="rtl">شماره حساب:</span> {bankInfo.accountNumber || '—'}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-slate-700">بارگذاری رسید پرداخت (JPEG یا PNG — حداکثر ۴ مگابایت)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] || null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-white px-4 py-6 text-sm font-bold text-emerald-800 transition hover:border-emerald-500"
        >
          {file ? <ImageIcon className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
          {file ? file.name : 'انتخاب تصویر رسید'}
        </button>
        {(localError || error) ? (
          <p className="mt-2 text-xs text-red-600">{localError || error}</p>
        ) : null}
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          پس از واریز، تصویر واضح رسید بانکی را بارگذاری کنید. سفارش پس از تأیید پشتیبانی (معمولاً کمتر از ۲۴ ساعت) پردازش می‌شود.
        </p>
      </div>
    </div>
  );
}
