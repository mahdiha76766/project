'use client';

import { useEffect, useState, useRef } from 'react';
import { Save, Download, CloudUpload, UploadCloud } from 'lucide-react';
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

interface BackupSettings {
  schedule: string;
  enabled: boolean;
  googleDriveFolderId: string;
  googleServiceAccountJson: string;
}

export default function AdminBackupsPage() {
  const [settings, setSettings] = useState<BackupSettings>({
    schedule: '0 2 * * *',
    enabled: false,
    googleDriveFolderId: '',
    googleServiceAccountJson: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups').then(r => r.json());
      if (res.ok && res.data?.settings) {
        setSettings(res.data.settings);
      } else {
        setError(res.error || 'Failed to load settings');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', settings })
      }).then(r => r.json());

      if (res.ok) {
        setMessage('تنظیمات با موفقیت ذخیره شد.');
      } else {
        setError(res.error || 'خطا در ذخیره تنظیمات');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const manualBackupToCloud = async () => {
    setBackingUp(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup_google_drive' })
      }).then(r => r.json());

      if (res.ok) {
        setMessage('بک‌آپ با موفقیت در گوگل درایو آپلود شد.');
      } else {
        setError(res.error || 'خطا در آپلود بک‌آپ');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setBackingUp(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('آیا مطمئن هستید؟ این عملیات اطلاعات فعلی سایت را پاک کرده و با فایل بک‌آپ جایگزین می‌کند.')) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setRestoring(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        body: formData
      }).then(r => r.json());

      if (res.ok) {
        setMessage('بازگردانی اطلاعات با موفقیت انجام شد!');
      } else {
        setError(res.error || 'خطا در بازگردانی اطلاعات');
      }
    } catch (e: any) {
      setError(e.message);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setRestoring(false);
  };

  if (loading) return <p className="text-sm text-slate-500">در حال بارگذاری...</p>;

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="بک‌آپ گیری و بازگردانی"
        description="تنظیمات بک‌آپ گیری خودکار و دستی از دیتابیس و فایل‌ها"
      />

      {error && <AdminAlert tone="error">{error}</AdminAlert>}
      {message && <AdminAlert tone="success">{message}</AdminAlert>}

      <div className="grid gap-6 md:grid-cols-2">
        <AdminCard title="تنظیمات زمان‌بندی خودکار">
          <div className="space-y-4">
            <AdminCheckbox
              label="فعال‌سازی بک‌آپ خودکار (Cron Job)"
              checked={settings.enabled}
              onChange={(c) => setSettings({ ...settings, enabled: c })}
            />

            <div>
              <FieldLabel text="زمان‌بندی (Cron Expression)" />
              <TextInput
                dir="ltr"
                className="text-left"
                value={settings.schedule}
                onChange={(e) => setSettings({ ...settings, schedule: e.target.value })}
                placeholder="0 2 * * *"
              />
              <p className="mt-1 text-xs text-slate-500">
                پیش‌فرض `0 2 * * *` به معنی هر روز ساعت ۲ بامداد است.
              </p>
            </div>

            <div className="w-full flex">
              <AdminPrimaryButton onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
              </AdminPrimaryButton>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="عملیات دستی">
          <div className="flex flex-col gap-4">
            <a
              href="/api/admin/backups/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600 w-full"
            >
              <Download className="h-4 w-4" />
              دانلود بک‌آپ کامل (ZIP)
            </a>

            <button
              onClick={manualBackupToCloud}
              disabled={backingUp}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 w-full disabled:opacity-50"
            >
              <CloudUpload className="h-4 w-4" />
              {backingUp ? 'در حال آپلود...' : 'آپلود بک‌آپ در گوگل درایو'}
            </button>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <input
                type="file"
                accept=".zip"
                className="hidden"
                ref={fileInputRef}
                onChange={handleRestore}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 w-full disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                {restoring ? 'در حال بازگردانی...' : 'آپلود و بازگردانی اطلاعات (Restore)'}
              </button>
              <p className="mt-2 text-xs text-rose-600 text-center font-semibold">
                هشدار: با آپلود فایل بک‌آپ، تمام اطلاعات فعلی جایگزین می‌شود.
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminCard title="تنظیمات حساب کاربری گوگل درایو">
        <div className="space-y-4">
          <div>
            <FieldLabel text="Google Drive Folder ID" />
            <TextInput
              dir="ltr"
              className="text-left"
              value={settings.googleDriveFolderId}
              onChange={(e) => setSettings({ ...settings, googleDriveFolderId: e.target.value })}
              placeholder="1A2B3C4D5E6F..."
            />
          </div>
          <div>
            <FieldLabel text="Google Service Account JSON" />
            <TextArea
              dir="ltr"
              className="text-left font-mono text-xs"
              rows={10}
              value={settings.googleServiceAccountJson}
              onChange={(e) => setSettings({ ...settings, googleServiceAccountJson: e.target.value })}
              placeholder='{"type": "service_account", "project_id": "..."}'
            />
          </div>
        </div>
      </AdminCard>
    </main>
  );
}
