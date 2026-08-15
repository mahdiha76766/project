'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Database,
  FileCode2,
  Play,
  RefreshCw,
  Server,
  Terminal,
  XCircle
} from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPrimaryButton,
  FieldLabel,
  SelectInput,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import {
  buildEnvFile,
  buildStartCommands,
  defaultDeployConfig,
  type DeployConfig
} from '@/lib/admin/deploy-config';

type RuntimeStatus = {
  port: number;
  nodeEnv: string;
  mongoStatus: 'connected' | 'disconnected' | 'error';
  hasMongoUri: boolean;
  mongoUriMasked: string | null;
  mongoDbFromUri: string | null;
  mongoDbActive: string | null;
  hasAuthSecret: boolean;
  hasAppBaseUrl: boolean;
  hasPublicSiteUrl: boolean;
  hasSaman: boolean;
};

export default function AdminServerPage() {
  const [form, setForm] = useState<DeployConfig>(defaultDeployConfig);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [tab, setTab] = useState<'settings' | 'env' | 'commands'>('settings');

  const envText = useMemo(() => buildEnvFile(form), [form]);
  const commands = useMemo(() => buildStartCommands(form), [form]);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminFetch<{ config: DeployConfig; runtime: RuntimeStatus }>('/api/admin/deploy');
    if (!res.ok) setError(res.error);
    else {
      if (res.data?.config) setForm(res.data.config);
      if (res.data?.runtime) setRuntime(res.data.runtime);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const res = await adminFetch('/api/admin/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: form })
    });
    setSaving(false);
    if (!res.ok) setError(res.error || 'ذخیره ناموفق');
    else setMessage('تنظیمات ذخیره شد. فایل .env را از تب «فایل env» کپی و روی سرور قرار دهید، سپس اپ را ری‌استارت کنید.');
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('کپی در مرورگر انجام نشد.');
    }
  };

  const syncUrlFromPort = (port: number) => {
    const base = `http://localhost:${port}`;
    setForm((f) => ({
      ...f,
      port,
      appBaseUrl: f.appBaseUrl.includes('localhost') ? base : f.appBaseUrl,
      publicSiteUrl: f.publicSiteUrl.includes('localhost') ? base : f.publicSiteUrl,
      samanCallbackUrl: f.samanCallbackUrl.includes('localhost')
        ? `${base}/api/payment/verify`
        : f.samanCallbackUrl
    }));
  };

  if (loading) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>;

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="راه‌اندازی سرور"
        description="تنظیم پورت، دیتابیس، آدرس سایت و تولید فایل .env برای استقرار روی سرور"
      />

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      {runtime ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="پورت فعلی سرور"
            value={runtime.port.toLocaleString('fa-IR')}
            ok
            icon={Server}
          />
          <StatusCard
            label="MongoDB"
            value={runtime.mongoStatus === 'connected' ? 'متصل' : 'قطع'}
            ok={runtime.mongoStatus === 'connected'}
            icon={Database}
          />
          <StatusCard
            label="AUTH_SECRET"
            value={runtime.hasAuthSecret ? 'تنظیم شده' : 'تنظیم نشده'}
            ok={runtime.hasAuthSecret}
            icon={FileCode2}
          />
          <StatusCard
            label="درگاه سامان"
            value={runtime.hasSaman ? 'فعال' : 'ناقص'}
            ok={runtime.hasSaman}
            icon={Play}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1">
        {([
          { id: 'settings' as const, label: 'تنظیمات' },
          { id: 'env' as const, label: 'فایل .env' },
          { id: 'commands' as const, label: 'دستورات اجرا' }
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              tab === t.id ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'settings' ? (
        <AdminCard title="پیکربندی استقرار">
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-7 text-amber-900">
            این پروژه <strong>Next.js</strong> است و فرانت‌اند و API با هم روی <strong>یک پورت</strong> اجرا می‌شوند.
            نیازی به PORT جدا برای بک‌اند (مثل 5000) نیست — معمولاً پورت <strong>3000</strong> یا پشت Nginx روی 80/443.
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <FieldLabel text="پورت اجرا (PORT)" />
              <TextInput
                type="number"
                min={1}
                max={65535}
                value={String(form.port)}
                onChange={(e) => syncUrlFromPort(Number(e.target.value) || 3000)}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="محیط اجرا" />
              <SelectInput
                value={form.nodeEnv}
                onChange={(e) => setForm({ ...form, nodeEnv: e.target.value as DeployConfig['nodeEnv'] })}
              >
                <option value="production">production</option>
                <option value="development">development</option>
              </SelectInput>
            </div>
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <FieldLabel text="MongoDB URI" />
              <p className="mt-1 text-sm leading-7 text-slate-600">
                فقط در فایل <code className="rounded bg-white px-1">.env</code> روی سرور یا متغیرهای محیطی cPanel
                تنظیم می‌شود. از این پنل قابل تغییر نیست.
              </p>
              {runtime ? (
                <div className="mt-3 space-y-1 text-xs" dir="ltr">
                  <p className="font-mono text-slate-700">
                    MONGODB_URI: {runtime.mongoUriMasked ?? '(not set)'}
                  </p>
                  <p className="font-mono text-slate-700">
                    db from URI: {runtime.mongoDbFromUri ?? '—'} | active: {runtime.mongoDbActive ?? '—'}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="md:col-span-2 xl:col-span-3">
              <FieldLabel text="AUTH_SECRET" />
              <TextInput
                value={form.authSecret}
                onChange={(e) => setForm({ ...form, authSecret: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="APP_BASE_URL" />
              <TextInput
                value={form.appBaseUrl}
                onChange={(e) => setForm({ ...form, appBaseUrl: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="NEXT_PUBLIC_SITE_URL" />
              <TextInput
                value={form.publicSiteUrl}
                onChange={(e) => setForm({ ...form, publicSiteUrl: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="SAMAN_TERMINAL_ID" />
              <TextInput
                value={form.samanTerminalId}
                onChange={(e) => setForm({ ...form, samanTerminalId: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="SAMAN_MERCHANT_ID" />
              <TextInput
                value={form.samanMerchantId}
                onChange={(e) => setForm({ ...form, samanMerchantId: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="SAMAN_TERMINAL_PASS" />
              <TextInput
                value={form.samanTerminalPass}
                onChange={(e) => setForm({ ...form, samanTerminalPass: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel text="SAMAN_CALLBACK_URL" />
              <TextInput
                value={form.samanCallbackUrl}
                onChange={(e) => setForm({ ...form, samanCallbackUrl: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
            <div>
              <FieldLabel text="CRON_SECRET (اختیاری)" />
              <TextInput
                value={form.cronSecret}
                onChange={(e) => setForm({ ...form, cronSecret: e.target.value })}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <AdminPrimaryButton onClick={save} disabled={saving}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </AdminPrimaryButton>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              بروزرسانی وضعیت
            </button>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'env' ? (
        <AdminCard title="فایل .env برای سرور">
          <p className="mb-3 text-sm text-slate-600">
            این محتوا را در ریشه پروژه روی سرور با نام <code className="rounded bg-slate-100 px-1">.env</code> یا{' '}
            <code className="rounded bg-slate-100 px-1">.env.local</code> ذخیره کنید.
          </p>
          <div className="relative">
            <pre className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4 text-left text-xs leading-6 text-emerald-300">
              {envText}
            </pre>
            <button
              type="button"
              onClick={() => void copyText(envText, 'env')}
              className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-white/20"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied === 'env' ? 'کپی شد' : 'کپی'}
            </button>
          </div>
        </AdminCard>
      ) : null}

      {tab === 'commands' ? (
        <AdminCard title="دستورات راه‌اندازی روی سرور">
          <div className="space-y-4">
            {[
              { key: 'install', title: '۱. نصب وابستگی‌ها', cmd: commands.install },
              { key: 'build', title: '۲. بیلد production', cmd: commands.build },
              { key: 'start', title: '۳. اجرای مستقیم (بدون PM2)', cmd: commands.start },
              { key: 'pm2', title: '۴. PM2 — اجرا (پیشنهادی سرور)', cmd: commands.pm2 },
              { key: 'pm2Restart', title: '۵. PM2 — ری‌استارت', cmd: commands.pm2Restart },
              { key: 'dev', title: 'حالت توسعه', cmd: commands.dev }
            ].map(({ key, title, cmd }) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">{title}</p>
                  <button
                    type="button"
                    onClick={() => void copyText(cmd, key)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600"
                  >
                    <Copy className="h-3 w-3" />
                    {copied === key ? 'کپی شد' : 'کپی'}
                  </button>
                </div>
                <code className="block overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-left text-xs text-emerald-300" dir="ltr">
                  {cmd}
                </code>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-sky-900">
            <p className="flex items-center gap-2 font-bold">
              <Terminal className="h-4 w-4" />
              Nginx (اختیاری)
            </p>
            <p className="mt-2">
              در production معمولاً Nginx روی پورت 80/443 به <code>localhost:{form.port}</code> پروکسی می‌کند.
              <code className="mx-1 rounded bg-white px-1">APP_BASE_URL</code> باید آدرس عمومی دامنه باشد، نه localhost.
            </p>
          </div>
        </AdminCard>
      ) : null}
    </main>
  );
}

function StatusCard({
  label,
  value,
  ok,
  icon: Icon
}: {
  label: string;
  value: string;
  ok: boolean;
  icon: typeof Server;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        {ok ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <XCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>
      <p className="mt-3 text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
