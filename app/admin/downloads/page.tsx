'use client';

import { useEffect, useState } from 'react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminPageHeader,
  AdminPagination,
  AdminPrimaryButton,
  AdminProTable,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useAdminList } from '@/hooks/useAdminList';
import { adminFetch } from '@/lib/admin/client';
import { useAdminToast } from '@/components/admin/AdminToast';

type ProductOpt = { _id: string; name: string };
type DownloadItem = {
  _id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  kind: string;
  isActive: boolean;
  relatedProduct?: { _id: string; name: string } | string | null;
};

const emptyForm = {
  id: '',
  title: '',
  description: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  kind: 'pdf',
  relatedProduct: '',
  isActive: true
};

const KIND_LABEL: Record<string, string> = {
  pdf: 'PDF',
  brochure: 'بروشور',
  catalog: 'کاتالوگ',
  info: 'اطلاعات محصول'
};

export default function AdminDownloadsPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<DownloadItem>(
    '/api/admin/downloads'
  );
  const { notify } = useAdminToast();
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState<DownloadItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void adminFetch<{ items: ProductOpt[] }>('/api/admin/products?limit=100').then((res) => {
      if (res.ok) setProducts(res.data.items || []);
    });
  }, []);

  async function uploadPdf(file: File) {
    setUploading(true);
    setFormError('');
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'downloads');
    body.append('mode', 'pdf');
    const { ok, data, error: uploadError } = await adminFetch<{ url: string; filename: string; size: number }>(
      '/api/admin/upload',
      { method: 'POST', body }
    );
    setUploading(false);
    if (!ok) {
      setFormError(uploadError);
      notify(uploadError, 'error');
      return;
    }
    setForm((prev) => ({ ...prev, fileUrl: data.url, fileName: data.filename, fileSize: data.size || 0 }));
    notify('فایل آپلود شد.');
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setFormError('');
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      fileUrl: form.fileUrl,
      fileName: form.fileName,
      fileSize: form.fileSize,
      kind: form.kind,
      relatedProduct: form.relatedProduct || null,
      isActive: form.isActive
    };
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/downloads/${form.id}` : '/api/admin/downloads';
    const { ok, error: saveError } = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!ok) {
      setFormError(saveError);
      notify(saveError, 'error');
      return;
    }
    notify(form.id ? 'دانلود ویرایش شد.' : 'دانلود ایجاد شد.');
    setForm(emptyForm);
    reload();
  }

  return (
    <main className="space-y-6">
      <AdminPageHeader title="دانلودها و بروشورها" description="PDF، کاتالوگ و فایل اطلاعاتی محصولات را مدیریت کنید." />
      <AdminCard title={form.id ? 'ویرایش فایل' : 'افزودن فایل'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel text="عنوان" /><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <FieldLabel text="نوع" />
            <SelectInput value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {Object.entries(KIND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectInput>
          </div>
          <div className="md:col-span-2"><FieldLabel text="توضیح" /><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <FieldLabel text="محصول مرتبط" />
            <SelectInput value={form.relatedProduct} onChange={(e) => setForm({ ...form, relatedProduct: e.target.value })}>
              <option value="">بدون محصول</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </SelectInput>
          </div>
          <AdminCheckbox label="فعال" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
          <div className="md:col-span-2">
            <FieldLabel text="فایل PDF" />
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPdf(file);
              }}
            />
            {form.fileUrl ? (
              <p className="mt-2 text-xs text-surface-500" dir="ltr">{form.fileUrl}</p>
            ) : null}
          </div>
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        <div className="mt-4 flex gap-2">
          <AdminPrimaryButton disabled={saving || uploading || !form.title.trim() || !form.fileUrl} onClick={() => void save()}>
            {saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ثبت فایل'}
          </AdminPrimaryButton>
          {form.id ? (
            <button type="button" className="h-11 rounded-xl border px-4 text-sm" onClick={() => setForm(emptyForm)}>انصراف</button>
          ) : null}
        </div>
      </AdminCard>
      <AdminCard title="فایل‌ها">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(row) => row._id}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          emptyMessage="فایلی ثبت نشده است."
          columns={[
            { id: 'title', header: 'عنوان', sortable: true },
            { id: 'kind', header: 'نوع', render: (row) => KIND_LABEL[row.kind] || row.kind },
            { id: 'fileName', header: 'نام فایل' },
            {
              id: 'relatedProduct',
              header: 'محصول',
              accessor: (row) => (typeof row.relatedProduct === 'object' && row.relatedProduct ? row.relatedProduct.name : '')
            },
            {
              id: 'isActive',
              header: 'وضعیت',
              type: 'badge',
              badge: (row) => ({ label: row.isActive ? 'فعال' : 'غیرفعال', tone: row.isActive ? 'success' : 'neutral' })
            }
          ]}
          actions={[
            {
              id: 'edit',
              label: 'ویرایش',
              icon: 'edit',
              onClick: (row) =>
                setForm({
                  id: row._id,
                  title: row.title,
                  description: row.description || '',
                  fileUrl: row.fileUrl,
                  fileName: row.fileName || '',
                  fileSize: row.fileSize || 0,
                  kind: row.kind,
                  relatedProduct: typeof row.relatedProduct === 'object' ? row.relatedProduct?._id || '' : String(row.relatedProduct || ''),
                  isActive: row.isActive
                })
            },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (row) => setPending(row) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
      <AdminConfirmDialog
        open={Boolean(pending)}
        title="حذف فایل"
        description="این فایل از فهرست دانلودها حذف می‌شود."
        loading={busy}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          setBusy(true);
          const { ok, error: deleteError } = await adminFetch(`/api/admin/downloads/${pending._id}`, { method: 'DELETE' });
          setBusy(false);
          if (!ok) notify(deleteError, 'error');
          else {
            notify('فایل حذف شد.');
            setPending(null);
            reload();
          }
        }}
      />
    </main>
  );
}
