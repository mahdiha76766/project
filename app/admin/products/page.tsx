'use client';

import { useEffect, useState } from 'react';
import { Box, FolderTree, Hash, Layers, Tag, FileSpreadsheet } from 'lucide-react';
import {
  AdminProductVariantsEditor,
  emptyVariantRow,
  type VariantFormRow
} from '@/components/admin/AdminProductVariantsEditor';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminMediaUploader,
  AdminPageHeader,
  AdminPagination,
  AdminPrimaryButton,
  AdminProTable,
  AdminRichTextEditor,
  FieldLabel,
  SelectInput,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { buildProductAttributes, extractProductSpecForm, usageTypeOptions, weightUnitOptions } from '@/lib/product/specs';
import { useAdminList } from '@/hooks/useAdminList';
import type { GalleryMediaItem } from '@/lib/media/gallery';

type Cat = { _id: string; name: string };
type Prod = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images?: string[];
  media?: GalleryMediaItem[];
  shortDescription?: string;
  fullDescription?: string;
  sku?: string;
  tags?: string[];
  category?: Cat | string;
  attributes?: Record<string, string>;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  usageType?: string;
  isActive: boolean;
  variants?: Array<{
    _id?: string;
    name: string;
    sku?: string;
    price: number;
    discountPrice?: number;
    stock: number;
    weight?: number;
    weightUnit?: string;
    containerSize?: string;
    isDefault?: boolean;
  }>;
};

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  category: '',
  price: '',
  stock: '',
  sku: '',
  tags: '',
  media: [] as GalleryMediaItem[],
  weight: '',
  weightUnit: 'g',
  containerSize: '',
  usageType: 'EDIBLE',
  origin: '',
  extraction: '',
  ingredients: '',
  storage: '',
  shelfLife: '',
  purity: '',
  aroma: '',
  usage: '',
  isActive: true,
  variants: [] as VariantFormRow[]
};

export default function AdminProductsPage() {
  const { items, page, setPage, totalPages, total, loading, error, reload } = useAdminList<Prod>('/api/admin/products');
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelInfo, setExcelInfo] = useState<{ exists: boolean; modifiedAt?: string; publicPath?: string } | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    void (async () => {
      const [excelRes, catsRes] = await Promise.all([
        adminFetch<{ exists: boolean; modifiedAt?: string; publicPath?: string }>('/api/admin/products/import-excel'),
        adminFetch<{ items: Cat[] }>('/api/admin/categories?all=1')
      ]);
      if (excelRes.ok) setExcelInfo(excelRes.data);
      if (catsRes.ok) setCats(catsRes.data.items || []);
    })();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const save = async () => {
    setFormError('');
    setMessage('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortDescription: form.shortDescription.trim(),
        fullDescription: form.fullDescription.trim(),
        category: form.category,
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        sku: form.sku.trim(),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        media: form.media,
        weight: form.weight ? Number(form.weight) : undefined,
        weightUnit: form.weightUnit,
        containerSize: form.containerSize.trim(),
        usageType: form.usageType,
        attributes: buildProductAttributes(form),
        isActive: form.isActive,
        variants: form.variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            ...(v._id ? { _id: v._id } : {}),
            name: v.name.trim(),
            sku: v.sku.trim(),
            price: Number(v.price || 0),
            discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
            stock: Number(v.stock || 0),
            weight: v.weight ? Number(v.weight) : undefined,
            weightUnit: v.weightUnit,
            containerSize: v.containerSize?.trim() || v.name.trim(),
            isDefault: v.isDefault
          }))
      };

      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const { ok, error: saveError } = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!ok) {
        setFormError(saveError);
        return;
      }

      setMessage(form.id ? 'محصول با موفقیت ویرایش شد.' : 'محصول با موفقیت ایجاد شد.');
      resetForm();
      reload();
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ذخیره محصول');
    } finally {
      setSaving(false);
    }
  };

  const editItem = (p: Prod) => {
    setFormError('');
    setMessage('');
    const categoryId = typeof p.category === 'object' && p.category ? p.category._id : String(p.category || '');
    const spec = extractProductSpecForm(p);
    setForm({
      id: p._id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription || '',
      fullDescription: p.fullDescription || '',
      category: categoryId,
      price: String(p.price),
      stock: String(p.stock),
      sku: p.sku || '',
      tags: (p.tags || []).join(', '),
      media: p.media?.length
        ? p.media
        : (p.images || []).map((url) => ({ type: 'image' as const, url })),
      ...spec,
      isActive: p.isActive,
      variants: (p.variants || []).map((v) => ({
        _id: v._id,
        name: v.name,
        sku: v.sku || '',
        price: String(v.price),
        discountPrice: v.discountPrice != null ? String(v.discountPrice) : '',
        stock: String(v.stock),
        weight: v.weight != null ? String(v.weight) : '',
        weightUnit: v.weightUnit || 'g',
        containerSize: v.containerSize || v.name || '',
        isDefault: Boolean(v.isDefault)
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async (id: string) => {
    if (!confirm('این محصول حذف شود؟')) return;
    const { ok, error: deleteError } = await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!ok) setFormError(deleteError);
    else {
      setMessage('محصول حذف شد.');
      reload();
    }
  };

  const runExcelImport = async (dryRun: boolean) => {
    setImporting(true);
    setImportResult(null);
    setFormError('');
    const { ok, data, error } = await adminFetch<{ message?: string; result?: any }>(
      '/api/admin/products/import-excel',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      }
    );
    setImporting(false);
    if (!ok) {
      setFormError(error || 'خطا در import از اکسل');
      return;
    }
    setImportResult(data);
    setMessage(data?.message || (dryRun ? 'پیش‌نمایش انجام شد' : 'همگام‌سازی انجام شد'));
    if (!dryRun) reload();
  };

  return (
    <main>
      <AdminPageHeader title="مدیریت محصولات" description="ایجاد، ویرایش و مدیریت موجودی محصولات فروشگاه" />

      <AdminCard
        title="همگام‌سازی از اکسل"
        actions={
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            site_prices
          </span>
        }
      >
        <p className="text-sm leading-7 text-slate-600">
          فایل <code dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">uploads/products.xlsx</code>
          {' '}— شیت <strong>site_prices</strong>
          {' '}خوانده می‌شود. محصولات موجود فقط از نظر قیمت به‌روزرسانی می‌شوند و موارد جدید import می‌شوند.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          مسیر production: <span dir="ltr">{excelInfo?.publicPath || '/uploads/products.xlsx'}</span>
          {excelInfo?.exists && excelInfo.modifiedAt ? (
            <> — آخرین تغییر: {new Date(excelInfo.modifiedAt).toLocaleString('fa-IR')}</>
          ) : (
            <> — فایل هنوز در سرور یافت نشد</>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton
            onClick={() => void runExcelImport(false)}
            disabled={importing || !excelInfo?.exists}
          >
            {importing ? 'در حال همگام‌سازی...' : 'همگام‌سازی قیمت‌ها از اکسل'}
          </AdminPrimaryButton>
          <button
            type="button"
            onClick={() => void runExcelImport(true)}
            disabled={importing || !excelInfo?.exists}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            پیش‌نمایش بدون ذخیره
          </button>
        </div>
        {importResult?.result ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-bold text-slate-800">نتیجه:</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>ردیف‌های فعال: {importResult.result.activeRows?.toLocaleString('fa-IR')}</li>
              <li>به‌روزرسانی قیمت: {importResult.result.updated?.length?.toLocaleString('fa-IR')}</li>
              <li>محصول جدید: {importResult.result.imported?.length?.toLocaleString('fa-IR')}</li>
              <li>بدون تغییر: {importResult.result.unchanged?.toLocaleString('fa-IR')}</li>
              <li>خطا: {importResult.result.errors?.length?.toLocaleString('fa-IR')}</li>
            </ul>
            {importResult.result.updated?.length ? (
              <p className="mt-3 text-xs text-emerald-700">
                نمونه به‌روزرسانی: {importResult.result.updated.slice(0, 5).map((r: { name: string }) => r.name).join('، ')}
              </p>
            ) : null}
            {importResult.result.imported?.length ? (
              <p className="mt-1 text-xs text-sky-700">
                نمونه import: {importResult.result.imported.slice(0, 5).map((r: { name: string }) => r.name).join('، ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </AdminCard>

      <AdminCard title={form.id ? 'ویرایش محصول' : 'ایجاد محصول'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><FieldLabel text="نام" /><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><FieldLabel text="اسلاگ" /><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" className="text-right" /></div>
          <div>
            <FieldLabel text="دسته‌بندی" />
            <SelectInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">انتخاب دسته‌بندی</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </SelectInput>
          </div>
          <div><FieldLabel text="SKU" /><TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} dir="ltr" className="text-right" /></div>
          <div>
            <FieldLabel text="قیمت پایه (ریال)" />
            <TextInput
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              dir="ltr"
              className="text-right"
              disabled={form.variants.length > 0}
            />
            {form.variants.length > 0 ? <p className="mt-1 text-[10px] text-slate-500">از نوع پیش‌فرض همگام می‌شود</p> : null}
          </div>
          <div>
            <FieldLabel text="موجودی کل" />
            <TextInput
              inputMode="numeric"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              dir="ltr"
              className="text-right"
              disabled={form.variants.length > 0}
            />
            {form.variants.length > 0 ? <p className="mt-1 text-[10px] text-slate-500">جمع موجودی انواع</p> : null}
          </div>
          <div className="md:col-span-2"><FieldLabel text="تگ‌ها (با کاما جدا کنید)" /><TextInput value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div className="xl:col-span-2"><FieldLabel text="توضیح کوتاه" /><TextInput value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
          <div><FieldLabel text="وزن" /><TextInput inputMode="numeric" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} dir="ltr" className="text-right" /></div>
          <div>
            <FieldLabel text="واحد وزن" />
            <SelectInput value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}>
              {weightUnitOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </SelectInput>
          </div>
          <div><FieldLabel text="اندازه ظرف" /><TextInput value={form.containerSize} onChange={(e) => setForm({ ...form, containerSize: e.target.value })} placeholder="مثلاً ۵۰۰ میلی‌لیتر" /></div>
          <div>
            <FieldLabel text="نوع کاربرد" />
            <SelectInput value={form.usageType} onChange={(e) => setForm({ ...form, usageType: e.target.value })}>
              {usageTypeOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </SelectInput>
          </div>
          <div><FieldLabel text="منشأ / کشور مبدأ" /><TextInput value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="مثلاً ایران" /></div>
          <div><FieldLabel text="روش استخراج" /><TextInput value={form.extraction} onChange={(e) => setForm({ ...form, extraction: e.target.value })} placeholder="مثلاً کندگاهی، بخارپز" /></div>
          <div className="md:col-span-2"><FieldLabel text="مواد تشکیل‌دهنده" /><TextInput value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="مثلاً ۱۰۰٪ روغن کنجد خالص" /></div>
          <div><FieldLabel text="شرایط نگهداری" /><TextInput value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} placeholder="دور از نور و گرما" /></div>
          <div><FieldLabel text="مدت ماندگاری" /><TextInput value={form.shelfLife} onChange={(e) => setForm({ ...form, shelfLife: e.target.value })} placeholder="مثلاً ۱۲ ماه" /></div>
          <div><FieldLabel text="درجه خلوص / کیفیت" /><TextInput value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} placeholder="مثلاً درجه یک" /></div>
          <div><FieldLabel text="عرق و بو" /><TextInput value={form.aroma} onChange={(e) => setForm({ ...form, aroma: e.target.value })} placeholder="مناسب ادویه‌ها" /></div>
          <div className="md:col-span-2"><FieldLabel text="کاربرد پیشنهادی" /><TextInput value={form.usage} onChange={(e) => setForm({ ...form, usage: e.target.value })} placeholder="پخت، سالاد، ماساژ" /></div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminRichTextEditor
              label="توضیح کامل"
              value={form.fullDescription}
              onChange={(fullDescription) => setForm({ ...form, fullDescription })}
              uploadFolder="products"
            />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminMediaUploader
              label="گالری محصول (تصویر و ویدیو)"
              folder="products"
              value={form.media}
              onChange={(media) => setForm({ ...form, media })}
              maxFiles={12}
              hint="تصاویر و ویدیوها در گالری محصول قاطی نمایش داده می‌شوند. اولین آیتم، پیش‌فرض گالری است."
            />
          </div>
          <AdminProductVariantsEditor
            variants={form.variants}
            onChange={(variants) => {
              const def = variants.find((v) => v.isDefault) || variants[0];
              const totalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
              setForm({
                ...form,
                variants,
                ...(def
                  ? {
                      price: def.price,
                      stock: String(totalStock),
                      sku: def.sku || form.sku
                    }
                  : {})
              });
            }}
          />
          <AdminCheckbox label="محصول فعال باشد" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ایجاد محصول'}
          </AdminPrimaryButton>
          {form.id ? <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">انصراف</button> : null}
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        {message ? <div className="mt-3"><AdminAlert tone="success">{message}</AdminAlert></div> : null}
      </AdminCard>

      <AdminCard title="لیست محصولات">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(p) => p._id}
          searchPlaceholder="جستجو در نام، SKU، موجودی..."
          columns={[
            {
              id: 'images',
              header: 'تصویر',
              icon: <Layers className="h-3.5 w-3.5" />,
              type: 'images',
              accessor: (p) => p.images,
              sortable: false,
              searchable: false,
              width: '100px'
            },
            {
              id: 'name',
              header: 'نام',
              icon: <Box className="h-3.5 w-3.5" />,
              type: 'text',
              accessor: (p) => p.name,
              sortable: true,
              searchable: true
            },
            {
              id: 'category',
              header: 'دسته',
              icon: <FolderTree className="h-3.5 w-3.5" />,
              accessor: (p) => (typeof p.category === 'object' && p.category ? p.category.name : '-'),
              sortable: true,
              searchable: true
            },
            {
              id: 'sku',
              header: 'SKU',
              icon: <Hash className="h-3.5 w-3.5" />,
              type: 'ltr',
              accessor: (p) => p.sku || '-',
              sortable: true,
              searchable: true
            },
            {
              id: 'price',
              header: 'قیمت',
              type: 'currency',
              accessor: (p) => p.price,
              sortable: true
            },
            {
              id: 'stock',
              header: 'موجودی',
              type: 'number',
              accessor: (p) => p.stock,
              sortable: true,
              searchable: true
            },
            {
              id: 'variants',
              header: 'انواع',
              accessor: (p) => (p.variants?.length ? `${p.variants.length} نوع` : 'تک‌نوع'),
              sortable: false,
              searchable: false
            },
            {
              id: 'isActive',
              header: 'وضعیت',
              icon: <Tag className="h-3.5 w-3.5" />,
              type: 'badge',
              accessor: (p) => p.isActive,
              badge: (p) => ({ label: p.isActive ? 'فعال' : 'غیرفعال', tone: p.isActive ? 'success' : 'neutral' }),
              sortable: true
            }
          ]}
          actions={[
            { id: 'edit', label: 'ویرایش', icon: 'edit', tone: 'primary', onClick: editItem },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (p) => removeItem(p._id) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
