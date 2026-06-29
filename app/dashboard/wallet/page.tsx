'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  PlusCircle,
  History,
  Lock,
  Sparkles,
  Landmark
} from 'lucide-react';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading, DashPageHeader } from '@/components/shop/DashboardUI';
import { CardToCardPaymentPanel } from '@/components/shop/checkout/CardToCardPaymentPanel';
import { formatDashCurrency, formatDashDateTime, shortPaymentRef } from '@/lib/dashboard/formats';
import { TRANSACTION_TYPE_LABELS } from '@/lib/dashboard/labels';

type Tx = {
  transactionId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};

type BankInfo = {
  enabled: boolean;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  instructions: string;
};

const creditTypes = new Set(['DEPOSIT', 'REFUND', 'CASHBACK', 'GIFT', 'TRANSFER_IN', 'RELEASE']);

export default function WalletPage() {
  const [wallet, setWallet] = useState({ availableBalance: 0, blockedBalance: 0, currency: 'IRR' });
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card_to_card' | 'wallet'>('card_to_card');
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [toMobile, setToMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [walletRes, txRes, bankRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/finance/my-transactions?limit=15'),
        fetch('/api/card-to-card/info')
      ]);
      const walletData = await walletRes.json();
      const txData = await txRes.json();
      const bankData = await bankRes.json().catch(() => null);
      if (!walletRes.ok) throw new Error(walletData.error);
      setWallet(walletData.wallet);
      setTransactions(txData.items || []);
      if (bankData) setBankInfo(bankData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const deposit = async () => {
    setMessage('');
    setError('');
    if (depositMethod === 'card_to_card' && !receiptFile) {
      setError('لطفاً تصویر رسید را بارگذاری کنید.');
      return;
    }
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Number(depositAmount), method: depositMethod })
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }

    if (depositMethod === 'card_to_card' && data.invoiceNumber) {
      const fd = new FormData();
      fd.append('file', receiptFile!);
      fd.append('invoiceNumber', data.invoiceNumber);
      fd.append('type', 'wallet_topup');
      const receiptRes = await fetch('/api/payment/receipt', { method: 'POST', body: fd });
      const receiptData = await receiptRes.json();
      if (!receiptRes.ok) { setError(receiptData.error || 'خطا در ثبت رسید'); return; }
      setMessage('رسید ثبت شد. پس از تأیید پشتیبانی، موجودی شما افزایش می‌یابد.');
      setDepositAmount('');
      setReceiptFile(null);
      void load();
      return;
    }

    if (data.redirectUrl) window.location.href = data.redirectUrl;
    else { setMessage('شارژ با موفقیت انجام شد'); setDepositAmount(''); }
    void load();
  };

  const transfer = async () => {
    setMessage('');
    setError('');
    const res = await fetch('/api/wallet/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toMobile, amount: Number(transferAmount) })
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    else { setMessage('انتقال با موفقیت انجام شد'); setTransferAmount(''); setToMobile(''); void load(); }
  };

  if (loading) return <DashLoading />;

  return (
    <div>
      <DashPageHeader title="کیف پول" subtitle="شارژ موجودی، انتقال وجه و مشاهده تراکنش‌های اخیر" />

      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-500 via-amber-600 to-orange-600 p-5 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-amber-100">
              <Wallet size={18} />
              موجودی قابل استفاده
            </div>
            <p className="mt-2 text-3xl font-black">{formatDashCurrency(wallet.availableBalance)}</p>
            {wallet.blockedBalance > 0 ? (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-amber-100">
                <Lock size={14} />
                بلوکه شده: {formatDashCurrency(wallet.blockedBalance)}
              </p>
            ) : null}
          </div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Sparkles size={26} />
          </span>
        </div>
      </section>

      {error ? <DashError text={error} /> : null}
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DashCard title="شارژ کیف پول">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDepositMethod('card_to_card')}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${depositMethod === 'card_to_card' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}
              >
                <Landmark size={14} /> کارت به کارت
              </button>
            </div>
            <input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="مبلغ شارژ (ریال)"
              className="h-11 w-full rounded-xl border border-slate-200 px-3"
            />
            {depositMethod === 'card_to_card' ? (
              <CardToCardPaymentPanel
                bankInfo={bankInfo}
                amount={depositAmount ? Number(depositAmount) : undefined}
                file={receiptFile}
                onFileSelect={setReceiptFile}
              />
            ) : null}
            <button
              onClick={deposit}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-600 px-5 font-bold text-white transition hover:bg-amber-700"
            >
              <PlusCircle size={18} />
              {depositMethod === 'card_to_card' ? 'ثبت رسید شارژ' : 'شارژ کیف پول'}
            </button>
          </div>
        </DashCard>

        <DashCard title="انتقال به کاربر دیگر">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">انتقال مستقیم موجودی به شماره موبایل کاربر دیگر.</p>
            <input
              value={toMobile}
              onChange={(e) => setToMobile(e.target.value)}
              placeholder="موبایل مقصد"
              className="h-11 w-full rounded-xl border border-slate-200 px-3"
            />
            <input
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="مبلغ انتقال (ریال)"
              className="h-11 w-full rounded-xl border border-slate-200 px-3"
            />
            <button
              onClick={transfer}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-bold text-slate-800 transition hover:bg-slate-50"
            >
              <Send size={18} />
              انتقال وجه
            </button>
          </div>
        </DashCard>
      </div>

      <DashCard
        title="تراکنش‌های اخیر کیف پول"
        action={
          <a href="/dashboard/transactions" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
            <History size={14} />
            مشاهده همه
          </a>
        }
      >
        {transactions.length === 0 ? (
          <DashEmpty text="هنوز تراکنشی ثبت نشده است." />
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isCredit = creditTypes.has(tx.type);
              const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={tx.transactionId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{TRANSACTION_TYPE_LABELS[tx.type] || tx.type}</p>
                      <p className="mt-1 text-xs text-slate-500">{tx.description || 'بدون توضیح'}</p>
                      <p className="mt-1 text-xs text-slate-400">کد: {shortPaymentRef(tx.transactionId)} · {formatDashDateTime(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-black ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isCredit ? '+' : '-'}{formatDashCurrency(tx.amount)}
                    </p>
                    <DashBadge label={`موجودی: ${formatDashCurrency(tx.balanceAfter)}`} tone="slate" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashCard>
    </div>
  );
}
