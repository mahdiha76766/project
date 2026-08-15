'use client';

import { useEffect, useState } from 'react';
import { FolderTree, Hash, ImageIcon, Layers, Tag } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminPageHeader,
  AdminPagination,
  AdminPrimaryButton,
  AdminProTable,
  AdminSingleImageUploader,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { useAdminList } from '@/hooks/useAdminList';

type Cat = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  parent?: { _id: string; name: string } | null;
};

const emptyForm = { id: '', name: '', slug: '', description: '', image: '', parent: '', isActive: true };

export default function AdminCategoriesPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<Cat>('/api/admin/categories');
  const [allCats, setAllCats] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOptions = async () => {
    const { ok, data } = await adminFetch<{ items: Cat[] }>('/api/admin/categories?all=1');
    if (ok) setAllCats(data.items || []);
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const save = async () => {
    setSaving(true);
    setFormError('');
    setMessage('');
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories';
    const { ok, error: saveError } = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
        parent: form.parent || null,
        isActive: form.isActive
      })
    });
    setSaving(false);
    if (!ok) {
      setFormError(saveError);
      return;
    }
    setMessage(form.id ? 'دسته‌بندی ویرایش شد.' : 'دسته‌بندی ایجاد شد.');
    resetForm();
    reload();
    void loadOptions();
  };

  const editItem = (c: Cat) => {
    setFormError('');
    setMessage('');
    setForm({
      id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      parent: c.parent?._id || '',
      isActive: c.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async (id: string) => {
    if (!confirm('این دسته‌بندی حذف شود؟')) return;
    const { ok, error: deleteError } = await adminFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    if (!ok) setFormError(deleteError);
    else {
      setMessage('دسته‌بندی حذف شد.');
      reload();
      void loadOptions();
    }
  };

  return (
    <main className="space-y-6">
      <AdminPageHeader title="مدیریت دسته‌بندی‌ها" description="ساختار دسته‌بندی محصولات فروشگاه را مدیریت کنید" />

      <AdminCard title={form.id ? 'ویرایش دسته‌بندی' : 'ایجاد دسته‌بندی'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><FieldLabel text="نام" /><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><FieldLabel text="اسلاگ" /><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" className="text-right" /></div>
          <div>
            <FieldLabel text="دسته والد" />
            <SelectInput value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
              <option value="">بدون والد</option>
              {(allCats.length ? allCats : items).filter((x) => x._id !== form.id).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </SelectInput>
          </div>
          <AdminCheckbox label="فعال" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
          <div className="xl:col-span-2"><FieldLabel text="توضیحات" /><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="xl:col-span-2">
            <AdminSingleImageUploader
              label="تصویر دسته‌بندی"
              folder="categories"
              value={form.image}
              onChange={(image) => setForm({ ...form, image })}
              hint="تصویر مربع با کیفیت بالا پیشنهاد می‌شود."
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
          </AdminPrimaryButton>
          {form.id ? <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">انصراف</button> : null}
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        {message ? <div className="mt-3"><AdminAlert tone="success">{message}</AdminAlert></div> : null}
      </AdminCard>

      <AdminCard title="لیست دسته‌بندی‌ها">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(c) => c._id}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          columns={[
            {
              id: 'image',
              header: 'تصویر',
              icon: <ImageIcon className="h-3.5 w-3.5" />,
              type: 'image',
              accessor: (c) => c.image,
              sortable: false,
              searchable: false,
              width: '90px'
            },
            {
              id: 'name',
              header: 'نام',
              icon: <Layers className="h-3.5 w-3.5" />,
              accessor: (c) => c.name,
              sortable: true,
              searchable: true
            },
            {
              id: 'slug',
              header: 'اسلاگ',
              icon: <Hash className="h-3.5 w-3.5" />,
              type: 'ltr',
              accessor: (c) => c.slug,
              sortable: true,
              searchable: true
            },
            {
              id: 'parent',
              header: 'والد',
              icon: <FolderTree className="h-3.5 w-3.5" />,
              accessor: (c) => c.parent?.name || '-',
              sortable: true,
              searchable: true
            },
            {
              id: 'isActive',
              header: 'وضعیت',
              icon: <Tag className="h-3.5 w-3.5" />,
              type: 'badge',
              accessor: (c) => c.isActive,
              badge: (c) => ({ label: c.isActive ? 'فعال' : 'غیرفعال', tone: c.isActive ? 'success' : 'neutral' }),
              sortable: true
            }
          ]}
          actions={[
            { id: 'edit', label: 'ویرایش', icon: 'edit', tone: 'primary', onClick: editItem },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (c) => removeItem(c._id) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
