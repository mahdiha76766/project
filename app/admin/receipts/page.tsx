'use client';

import { useEffect, useState } from 'react';
import { Check, ImageIcon, RefreshCw, Save, X } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminPageHeader,
  AdminPrimaryButton,
  FieldLabel,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import type { CardToCardSettings } from '@/lib/admin/card-to-card-config';
import { defaultCardToCardSettings } from '@/lib/admin/card-to-card-config';
import { formatDashCurrency } from '@/lib/dashboard/formats';

type ReceiptItem = {
  _id: string;
  type: string;
  invoiceNumber?: string;
  amount: number;
  imageUrl: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  user?: { name?: string; mobile?: string; email?: string };
  order?: { totalAmount?: number; orderStatus?: string };
};

export default function AdminReceiptsPage() {
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [settings, setSettings] = useState<CardToCardSettings>(defaultCardToCardSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('PENDING');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminFetch<{ items: ReceiptItem[]; settings: CardToCardSettings }>(
      `/api/admin/receipts?status=${filter}`
    );
    if (!res.ok) setError(res.error);
    else if (res.data) {
      setItems(res.data.items);
      if (res.data.settings) setSettings(res.data.settings);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    const res = await adminFetch('/api/admin/receipts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    setSaving(false);
    if (!res.ok) setError(res.error || 'ذخیره ناموفق');
    else setMessage('تنظیمات کارت به کارت ذخیره شد');
  };

  const review = async (id: string, action: 'approve' | 'reject') => {
    setError('');
    const note = action === 'reject' ? prompt('دلیل رد (اختیاری):') || '' : '';
    const res = await adminFetch(`/api/admin/receipts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note })
    });
    if (!res.ok) setError(res.error || 'خطا');
    else {
      setMessage(action === 'approve' ? 'رسید تأیید شد' : 'رسید رد شد');
      void load();
    }
  };

  const purge = async () => {
    const res = await adminFetch('/api/admin/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'purge' })
    });
    if (res.ok) setMessage(`پاکسازی انجام شد`);
  };

  return (
    <main>
      <AdminPageHeader
        title="تأیید رسیدهای کارت به کارت"
        description="بررسی تصاویر رسید، تأیید سفارش/شارژ کیف پول و تنظیم اطلاعات بانکی"
      />

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminCard title="تنظیمات کارت به کارت">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminCheckbox checked={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} label="فعال" />
          <div>
            <FieldLabel text="مدت نگهداری تصاویر (روز)" />
            <TextInput
              type="number"
              value={String(settings.receiptRetentionDays)}
              onChange={(e) => setSettings({ ...settings, receiptRetentionDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <FieldLabel text="نام بانک" />
            <TextInput value={settings.bankName} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="نام صاحب حساب" />
            <TextInput value={settings.accountHolder} onChange={(e) => setSettings({ ...settings, accountHolder: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="شماره کارت" />
            <TextInput dir="ltr" className="text-left font-mono" value={settings.cardNumber} onChange={(e) => setSettings({ ...settings, cardNumber: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="شماره حساب" />
            <TextInput dir="ltr" className="text-left font-mono" value={settings.accountNumber} onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel text="راهنمای پرداخت برای کاربر" />
            <TextArea rows={3} value={settings.instructions} onChange={(e) => setSettings({ ...settings, instructions: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <AdminPrimaryButton onClick={saveSettings} disabled={saving}>
            {saving ? 'ذخیره...' : 'ذخیره تنظیمات'}
          </AdminPrimaryButton>
          <button type="button" onClick={() => void purge()} className="rounded-xl border px-4 py-2 text-sm font-bold text-slate-600">
            پاکسازی تصاویر منقضی
          </button>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', ''].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === s ? 'bg-amber-500 text-white' : 'bg-slate-100'}`}
          >
            {s === 'PENDING' ? 'در انتظار' : s === 'APPROVED' ? 'تأیید شده' : s === 'REJECTED' ? 'رد شده' : 'همه'}
          </button>
        ))}
        <button type="button" onClick={() => void load()} className="mr-auto flex items-center gap-1 text-sm text-slate-500">
          <RefreshCw size={14} /> بروزرسانی
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : items.length === 0 ? (
        <AdminCard title="رسیدها">
          <p className="text-sm text-slate-500">رسیدی یافت نشد.</p>
        </AdminCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AdminCard key={item._id} title={item.type === 'wallet_topup' ? 'شارژ کیف پول' : 'سفارش'}>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">کاربر:</span> {item.user?.name || '—'} · {item.user?.mobile}</p>
                <p><span className="text-slate-500">مبلغ:</span> <span className="font-bold">{formatDashCurrency(item.amount)}</span></p>
                <p><span className="text-slate-500">فاکتور:</span> {item.invoiceNumber || '—'}</p>
                <p><span className="text-slate-500">وضعیت:</span> {item.status}</p>
                <button
                  type="button"
                  onClick={() => setPreview(item.imageUrl)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border bg-slate-50 py-8 text-slate-600"
                >
                  <ImageIcon size={20} />
                  مشاهده رسید
                </button>
                {item.status === 'PENDING' ? (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void review(item._id, 'approve')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white"
                    >
                      <Check size={16} /> تأیید
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(item._id, 'reject')}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-rose-600 py-2 text-sm font-bold text-white"
                    >
                      <X size={16} /> رد
                    </button>
                  </div>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {preview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="رسید" className="max-h-[90vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      ) : null}
    </main>
  );
}
