'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminAlert, AdminCard, AdminPageHeader } from '@/components/admin/ui';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { adminFetch } from '@/lib/admin/client';
import { useAdminToast } from '@/components/admin/AdminToast';

type MediaItem = {
  folder: string;
  filename: string;
  url: string;
  size: number;
  updatedAt: string;
  kind: 'image' | 'pdf' | 'file';
};

export default function AdminMediaPage() {
  const { notify } = useAdminToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<MediaItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data, error: fetchError } = await adminFetch<{ items: MediaItem[] }>('/api/admin/media');
    if (ok) setItems(data.items || []);
    else setError(fetchError);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(file: File) {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    body.append('folder', isPdf ? 'downloads' : 'media');
    if (isPdf) body.append('mode', 'pdf');
    const { ok, error: uploadError } = await adminFetch('/api/admin/upload', { method: 'POST', body });
    setUploading(false);
    if (!ok) {
      notify(uploadError, 'error');
      return;
    }
    notify('آپلود شد.');
    void load();
  }

  return (
    <main className="space-y-6">
      <AdminPageHeader title="کتابخانه رسانه" description="تصاویر و PDFهای آپلودشده. از زیرساخت آپلود موجود استفاده می‌شود." />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      <AdminCard title="آپلود">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </AdminCard>
      <AdminCard title="فایل‌ها">
        {loading ? <p className="text-sm text-surface-500">در حال بارگذاری...</p> : null}
        {!loading && !items.length ? <p className="text-sm text-surface-500">رسانه‌ای موجود نیست.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article key={`${item.folder}-${item.filename}`} className="overflow-hidden rounded-2xl border border-surface-200 bg-white">
              {item.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.filename} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-surface-50 text-sm font-bold text-brand-800">PDF</div>
              )}
              <div className="space-y-2 p-3">
                <p className="truncate text-xs" dir="ltr">{item.filename}</p>
                <p className="text-[11px] text-surface-500">
                  {item.folder} · {new Date(item.updatedAt).toLocaleDateString('fa-IR')}
                </p>
                <div className="flex gap-2">
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-800">مشاهده</a>
                  <button type="button" className="text-xs font-bold text-red-600" onClick={() => setPending(item)}>حذف</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AdminCard>
      <AdminConfirmDialog
        open={Boolean(pending)}
        title="حذف فایل رسانه"
        description="این فایل از دیسک حذف می‌شود."
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          const { ok, error: deleteError } = await adminFetch('/api/admin/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: pending.folder, filename: pending.filename })
          });
          if (!ok) notify(deleteError, 'error');
          else {
            notify('فایل حذف شد.');
            setPending(null);
            void load();
          }
        }}
      />
    </main>
  );
}
