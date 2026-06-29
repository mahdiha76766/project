'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
import {
  defaultSmsSettings,
  SMS_EVENT_LABELS,
  type SmsEventKey,
  type SmsSettings
} from '@/lib/admin/sms-settings-config';

type Tab = 'settings' | 'events' | 'send' | 'logs';

type SmsLogItem = {
  _id: string;
  mobile: string;
  message: string;
  eventKey?: string;
  sendType: string;
  status: string;
  providerMessage?: string;
  cost?: number;
  createdAt: string;
};

const EVENT_KEYS = Object.keys(SMS_EVENT_LABELS) as SmsEventKey[];

export default function AdminSmsPage() {
  const [tab, setTab] = useState<Tab>('settings');
  const [form, setForm] = useState<SmsSettings>(defaultSmsSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [credit, setCredit] = useState<number | null>(null);
  const [lines, setLines] = useState<(string | number)[]>([]);

  const [sendMobiles, setSendMobiles] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sendCoupon, setSendCoupon] = useState('');
  const [sendMode, setSendMode] = useState<'single' | 'coupon'>('single');
  const [sending, setSending] = useState(false);

  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminFetch<{ settings: SmsSettings; credit: number | null; lines: (string | number)[] }>(
      '/api/admin/sms/settings'
    );
    if (!res.ok) setError(res.error);
    else if (res.data) {
      setForm(res.data.settings);
      setCredit(res.data.credit);
      setLines(res.data.lines || []);
    }
    setLoading(false);
  };

  const loadLogs = async (page = 1) => {
    const res = await adminFetch<{ items: SmsLogItem[]; total: number }>(`/api/admin/sms/logs?page=${page}`);
    if (res.ok && res.data) {
      setLogs(res.data.items);
      setLogsTotal(res.data.total);
      setLogsPage(page);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (tab === 'logs') void loadLogs(1);
  }, [tab]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const res = await adminFetch<{ settings: SmsSettings }>('/api/admin/sms/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: form })
    });
    setSaving(false);
    if (!res.ok) setError(res.error || 'ذخیره ناموفق');
    else {
      setMessage('تنظیمات پیامک ذخیره شد');
      if (res.data?.settings) setForm(res.data.settings);
      void load();
    }
  };

  const sendSms = async () => {
    setSending(true);
    setMessage('');
    setError('');
    const mobiles = sendMobiles.split(/[\n,،;]/).map((s) => s.trim()).filter(Boolean);
    const res = await adminFetch('/api/admin/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        sendMode === 'coupon'
          ? { mode: 'coupon', mobiles, couponCode: sendCoupon, messageTemplate: sendMessage || undefined }
          : { mode: 'single', mobiles, message: sendMessage }
      )
    });
    setSending(false);
    if (!res.ok) setError(res.error || 'ارسال ناموفق');
    else {
      setMessage('پیامک با موفقیت ارسال شد');
      setSendMobiles('');
      setSendMessage('');
      setSendCoupon('');
    }
  };

  const updateEvent = (key: SmsEventKey, patch: Partial<SmsSettings['events'][SmsEventKey]>) => {
    setForm((f) => ({
      ...f,
      events: { ...f.events, [key]: { ...f.events[key], ...patch } }
    }));
  };

  if (loading) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'settings', label: 'اتصال و OTP' },
    { id: 'events', label: 'رویدادها' },
    { id: 'send', label: 'ارسال دستی' },
    { id: 'logs', label: 'گزارش ارسال' }
  ];

  return (
    <main>
      <AdminPageHeader
        title="مدیریت پیامک SMS.ir"
        description="تنظیم OTP، اطلاع‌رسانی سفارش، ارسال گروهی کد تخفیف و گزارش کامل"
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button type="button" onClick={() => void load()} className="mr-auto flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
          <RefreshCw size={14} /> بروزرسانی
        </button>
      </div>

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      {tab === 'settings' ? (
        <>
          <AdminCard title="وضعیت سرویس">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">اعتبار SMS.ir</p>
                <p className="text-xl font-black">{credit !== null ? credit.toLocaleString('fa-IR') : '—'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-xs text-slate-500">خطوط فعال</p>
                <p className="text-sm font-bold" dir="ltr">{lines.length ? lines.join(' · ') : '—'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <AdminCheckbox checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="فعال‌سازی سرویس پیامک" />
              <AdminCheckbox checked={form.useSandbox} onChange={(v) => setForm({ ...form, useSandbox: v })} label="محیط Sandbox (بدون ارسال واقعی)" />
              <AdminCheckbox checked={form.allowPasswordLogin} onChange={(v) => setForm({ ...form, allowPasswordLogin: v })} label="ورود با رمز عبور (کنار OTP)" />
            </div>
          </AdminCard>

          <AdminCard title="کلید API و خط">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel text="API Key (Production)" />
                <TextInput dir="ltr" className="text-left font-mono text-xs" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
              </div>
              <div>
                <FieldLabel text="API Key (Sandbox)" />
                <TextInput dir="ltr" className="text-left font-mono text-xs" value={form.sandboxApiKey} onChange={(e) => setForm({ ...form, sandboxApiKey: e.target.value })} />
              </div>
              <div>
                <FieldLabel text="شماره خط (Bulk)" />
                <TextInput dir="ltr" className="text-left" value={form.lineNumber} onChange={(e) => setForm({ ...form, lineNumber: e.target.value })} placeholder="30004505000017" />
              </div>
            </div>
          </AdminCard>

          <AdminCard title="تنظیمات OTP">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <FieldLabel text="طول کد" />
                <TextInput type="number" value={String(form.otpLength)} onChange={(e) => setForm({ ...form, otpLength: Number(e.target.value) })} />
              </div>
              <div>
                <FieldLabel text="انقضا (دقیقه)" />
                <TextInput type="number" value={String(form.otpExpireMinutes)} onChange={(e) => setForm({ ...form, otpExpireMinutes: Number(e.target.value) })} />
              </div>
              <div>
                <FieldLabel text="فاصله ارسال مجدد (ثانیه)" />
                <TextInput type="number" value={String(form.otpResendSeconds)} onChange={(e) => setForm({ ...form, otpResendSeconds: Number(e.target.value) })} />
              </div>
              <div>
                <FieldLabel text="حداکثر تلاش" />
                <TextInput type="number" value={String(form.otpMaxAttempts)} onChange={(e) => setForm({ ...form, otpMaxAttempts: Number(e.target.value) })} />
              </div>
            </div>
          </AdminCard>

          <AdminPrimaryButton onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </AdminPrimaryButton>
        </>
      ) : null}

      {tab === 'events' ? (
        <>
          <p className="text-sm text-slate-600">
            هر رویداد را می‌توانید جداگانه فعال/غیرفعال کنید. متغیرها: {'{name}'} {'{mobile}'} {'{orderId}'} {'{status}'} {'{tracking}'} {'{coupon}'} {'{code}'} {'{amount}'}
          </p>
          {EVENT_KEYS.map((key) => {
            const ev = form.events[key];
            return (
              <AdminCard
                key={key}
                title={SMS_EVENT_LABELS[key]}
                actions={
                  <AdminCheckbox checked={ev.enabled} onChange={(v) => updateEvent(key, { enabled: v })} label="فعال" />
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel text="نوع ارسال" />
                    <select
                      className="h-11 w-full rounded-xl border px-3 text-sm"
                      value={ev.mode}
                      onChange={(e) => updateEvent(key, { mode: e.target.value as 'verify' | 'bulk' })}
                    >
                      <option value="verify">Verify (قالب OTP)</option>
                      <option value="bulk">Bulk (متن آزاد)</option>
                    </select>
                  </div>
                  {ev.mode === 'verify' ? (
                    <>
                      <div>
                        <FieldLabel text="Template ID" />
                        <TextInput type="number" value={String(ev.templateId)} onChange={(e) => updateEvent(key, { templateId: Number(e.target.value) })} />
                      </div>
                      <div>
                        <FieldLabel text="نام پارامتر قالب" />
                        <TextInput value={ev.verifyParamName} onChange={(e) => updateEvent(key, { verifyParamName: e.target.value })} placeholder="Code" />
                      </div>
                    </>
                  ) : null}
                  <div className="md:col-span-2">
                    <FieldLabel text="متن / پیش‌نمایش" />
                    <TextArea rows={3} value={ev.messageTemplate} onChange={(e) => updateEvent(key, { messageTemplate: e.target.value })} />
                  </div>
                </div>
              </AdminCard>
            );
          })}
          <AdminPrimaryButton onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره...' : 'ذخیره رویدادها'}
          </AdminPrimaryButton>
        </>
      ) : null}

      {tab === 'send' ? (
        <AdminCard title="ارسال پیامک دستی / گروهی">
          <div className="mb-4 flex gap-2">
            <button type="button" className={`rounded-lg px-3 py-1.5 text-sm font-bold ${sendMode === 'single' ? 'bg-amber-500 text-white' : 'bg-slate-100'}`} onClick={() => setSendMode('single')}>
              متن آزاد
            </button>
            <button type="button" className={`rounded-lg px-3 py-1.5 text-sm font-bold ${sendMode === 'coupon' ? 'bg-amber-500 text-white' : 'bg-slate-100'}`} onClick={() => setSendMode('coupon')}>
              کد تخفیف گروهی
            </button>
          </div>
          <div className="grid gap-4">
            <div>
              <FieldLabel text="شماره‌ها (هر خط یا با ویرگول)" />
              <TextArea rows={4} dir="ltr" className="font-mono text-sm" value={sendMobiles} onChange={(e) => setSendMobiles(e.target.value)} placeholder="0912...,0919..." />
            </div>
            {sendMode === 'coupon' ? (
              <div>
                <FieldLabel text="کد تخفیف" />
                <TextInput dir="ltr" value={sendCoupon} onChange={(e) => setSendCoupon(e.target.value)} />
              </div>
            ) : null}
            <div>
              <FieldLabel text={sendMode === 'coupon' ? 'قالب پیام (اختیاری — {coupon})' : 'متن پیامک'} />
              <TextArea rows={4} value={sendMessage} onChange={(e) => setSendMessage(e.target.value)} placeholder={sendMode === 'coupon' ? 'کد تخفیف ویژه: {coupon}' : 'متن پیامک...'} />
            </div>
            <AdminPrimaryButton onClick={sendSms} disabled={sending}>
              {sending ? 'در حال ارسال...' : 'ارسال پیامک'}
            </AdminPrimaryButton>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'logs' ? (
        <AdminCard title={`گزارش ارسال (${logsTotal.toLocaleString('fa-IR')})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="[&>th]:px-3 [&>th]:py-2 text-right">
                  <th>زمان</th>
                  <th>موبایل</th>
                  <th>رویداد</th>
                  <th>وضعیت</th>
                  <th>هزینه</th>
                  <th>پیام</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log._id} className="[&>td]:px-3 [&>td]:py-2 align-top">
                    <td className="whitespace-nowrap text-xs">{new Date(log.createdAt).toLocaleString('fa-IR')}</td>
                    <td dir="ltr">{log.mobile}</td>
                    <td>{log.eventKey || log.sendType}</td>
                    <td>
                      <span className={log.status === 'sent' ? 'text-emerald-600' : 'text-rose-600'}>{log.status}</span>
                    </td>
                    <td>{log.cost ?? '—'}</td>
                    <td className="max-w-xs truncate text-xs text-slate-500">{log.message || log.providerMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logsTotal > 30 ? (
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={logsPage <= 1} className="rounded-lg bg-slate-100 px-3 py-1 text-sm disabled:opacity-50" onClick={() => void loadLogs(logsPage - 1)}>
                قبلی
              </button>
              <span className="py-1 text-sm">صفحه {logsPage}</span>
              <button type="button" disabled={logsPage * 30 >= logsTotal} className="rounded-lg bg-slate-100 px-3 py-1 text-sm disabled:opacity-50" onClick={() => void loadLogs(logsPage + 1)}>
                بعدی
              </button>
            </div>
          ) : null}
        </AdminCard>
      ) : null}
    </main>
  );
}
