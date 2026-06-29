'use client';

import { useEffect, useState } from 'react';
import { Calendar, Hash, Percent, Tag, Ticket } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminPageHeader,
  AdminPagination,
  AdminPrimaryButton,
  AdminProTable,
  FieldLabel,
  JalaliDateInput,
  SelectInput,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { formatJalaliDate } from '@/lib/admin/jalali';
import { DISCOUNT_TYPE_LABELS, labelOf } from '@/lib/admin/labels';
import { useAdminList } from '@/hooks/useAdminList';

type Cat = { _id: string; name: string };

type Coupon = {
  _id: string;
  code: string;
  title?: string;
  description?: string;
  discountType: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING';
  value: number;
  startsAt: string;
  expiresAt: string;
  usageLimit: number;
  usagePerUserLimit: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  allowedCategories?: string[] | Cat[];
  isActive: boolean;
};

const emptyForm = {
  id: '',
  code: '',
  title: '',
  description: '',
  discountType: 'PERCENT',
  value: '',
  startsAt: '',
  expiresAt: '',
  usageLimit: '0',
  usagePerUserLimit: '1',
  minPurchaseAmount: '0',
  maxDiscountAmount: '',
  allowedCategories: [] as string[],
  isActive: true
};

export default function AdminCouponsPage() {
  const { items, page, setPage, totalPages, total, loading, error, reload } = useAdminList<Coupon>('/api/admin/coupons');
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { ok, data } = await adminFetch<{ items: Cat[] }>('/api/admin/categories?all=1');
      if (ok) setCats(data.items || []);
    })();
  }, []);

  const resetForm = () => setForm(emptyForm);
  const isFreeShipping = form.discountType === 'FREE_SHIPPING';

  const save = async () => {
    setSaving(true);
    setFormError('');
    setMessage('');
    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      value: isFreeShipping ? 0 : Number(form.value || 0),
      startsAt: form.startsAt,
      expiresAt: form.expiresAt,
      usageLimit: Number(form.usageLimit || 0),
      usagePerUserLimit: Number(form.usagePerUserLimit || 1),
      minPurchaseAmount: Number(form.minPurchaseAmount || 0),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      allowedCategories: form.allowedCategories,
      isActive: form.isActive
    };
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/coupons/${form.id}` : '/api/admin/coupons';
    const { ok, error: saveError } = await adminFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!ok) {
      setFormError(saveError);
      return;
    }
    setMessage(form.id ? 'کد تخفیف ویرایش شد.' : 'کد تخفیف ایجاد شد.');
    resetForm();
    reload();
  };

  const editItem = (c: Coupon) => {
    setFormError('');
    setMessage('');
    const categoryIds = (c.allowedCategories || []).map((cat) =>
      typeof cat === 'object' && cat ? cat._id : String(cat)
    );
    setForm({
      id: c._id,
      code: c.code,
      title: c.title || '',
      description: c.description || '',
      discountType: c.discountType,
      value: String(c.value),
      startsAt: c.startsAt || '',
      expiresAt: c.expiresAt || '',
      usageLimit: String(c.usageLimit || 0),
      usagePerUserLimit: String(c.usagePerUserLimit || 1),
      minPurchaseAmount: String(c.minPurchaseAmount || 0),
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
      allowedCategories: categoryIds,
      isActive: c.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async (id: string) => {
    if (!confirm('این کد تخفیف حذف شود؟')) return;
    const { ok, error: deleteError } = await adminFetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (!ok) setFormError(deleteError);
    else {
      setMessage('کد تخفیف حذف شد.');
      reload();
    }
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      allowedCategories: prev.allowedCategories.includes(id)
        ? prev.allowedCategories.filter((c) => c !== id)
        : [...prev.allowedCategories, id]
    }));
  };

  return (
    <main>
      <AdminPageHeader title="مدیریت کدهای تخفیف" description="کدهای درصدی، مبلغ ثابت و ارسال رایگان اختصاصی" />

      <AdminCard title={form.id ? 'ویرایش کد تخفیف' : 'ایجاد کد تخفیف'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><FieldLabel text="کد" /><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} dir="ltr" className="text-right uppercase" /></div>
          <div>
            <FieldLabel text="نوع تخفیف" />
            <SelectInput value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="PERCENT">درصدی</option>
              <option value="FIXED">مبلغ ثابت</option>
              <option value="FREE_SHIPPING">ارسال رایگان</option>
            </SelectInput>
          </div>
          <div className="md:col-span-2"><FieldLabel text="عنوان نمایشی" /><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً ارسال رایگان ویژه" /></div>
          <div className="md:col-span-2 xl:col-span-4">
            <FieldLabel text="توضیحات" />
            <TextArea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="شرایط استفاده برای مشتری" />
          </div>
          {!isFreeShipping ? (
            <>
              <div><FieldLabel text={form.discountType === 'PERCENT' ? 'درصد تخفیف' : 'مبلغ تخفیف (ریال)'} /><TextInput inputMode="numeric" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} dir="ltr" className="text-right" /></div>
              {form.discountType === 'PERCENT' ? (
                <div><FieldLabel text="سقف تخفیف (ریال)" /><TextInput inputMode="numeric" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} dir="ltr" className="text-right" /></div>
              ) : null}
            </>
          ) : (
            <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              این کد هزینه ارسال (آنلاین و پرداخت در محل) را صفر می‌کند.
            </div>
          )}
          <div><FieldLabel text="حداقل خرید (ریال)" /><TextInput inputMode="numeric" value={form.minPurchaseAmount} onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })} dir="ltr" className="text-right" /></div>
          <JalaliDateInput label="تاریخ شروع" value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })} />
          <JalaliDateInput label="تاریخ انقضا" value={form.expiresAt} onChange={(expiresAt) => setForm({ ...form, expiresAt })} />
          <div><FieldLabel text="حد کل استفاده (۰ = نامحدود)" /><TextInput inputMode="numeric" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} dir="ltr" className="text-right" /></div>
          <div><FieldLabel text="حد استفاده هر کاربر" /><TextInput inputMode="numeric" value={form.usagePerUserLimit} onChange={(e) => setForm({ ...form, usagePerUserLimit: e.target.value })} dir="ltr" className="text-right" /></div>
          <div className="md:col-span-2 xl:col-span-4">
            <FieldLabel text="محدود به دسته‌بندی‌ها (اختیاری — خالی = همه)" />
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {cats.map((c) => (
                <label key={c._id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={form.allowedCategories.includes(c._id)}
                    onChange={() => toggleCategory(c._id)}
                  />
                  {c.name}
                </label>
              ))}
              {!cats.length ? <span className="text-xs text-slate-500">دسته‌بندی‌ای یافت نشد</span> : null}
            </div>
          </div>
          <AdminCheckbox label="فعال" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton onClick={save} disabled={saving}>{saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ایجاد کد'}</AdminPrimaryButton>
          {form.id ? <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">انصراف</button> : null}
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        {message ? <div className="mt-3"><AdminAlert tone="success">{message}</AdminAlert></div> : null}
      </AdminCard>

      <AdminCard title="لیست کدهای تخفیف">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(c) => c._id}
          columns={[
            { id: 'code', header: 'کد', icon: <Ticket className="h-3.5 w-3.5" />, type: 'ltr', accessor: (c) => c.code, sortable: true, searchable: true },
            { id: 'title', header: 'عنوان', accessor: (c) => c.title || '—', sortable: true, searchable: true },
            { id: 'discountType', header: 'نوع', icon: <Percent className="h-3.5 w-3.5" />, accessor: (c) => labelOf(DISCOUNT_TYPE_LABELS, c.discountType), sortable: true },
            {
              id: 'value',
              header: 'مقدار',
              render: (c) =>
                c.discountType === 'FREE_SHIPPING'
                  ? 'ارسال رایگان'
                  : c.discountType === 'PERCENT'
                    ? `${c.value.toLocaleString('fa-IR')}٪`
                    : `${c.value.toLocaleString('fa-IR')} ریال`,
              sortable: true,
              accessor: (c) => c.value
            },
            { id: 'range', header: 'بازه زمانی', icon: <Calendar className="h-3.5 w-3.5" />, accessor: (c) => `${formatJalaliDate(c.startsAt)} - ${formatJalaliDate(c.expiresAt)}` },
            { id: 'limits', header: 'محدودیت', icon: <Hash className="h-3.5 w-3.5" />, accessor: (c) => `${c.usagePerUserLimit} / ${c.usageLimit || '∞'}` },
            { id: 'isActive', header: 'وضعیت', icon: <Tag className="h-3.5 w-3.5" />, type: 'badge', badge: (c) => ({ label: c.isActive ? 'فعال' : 'غیرفعال', tone: c.isActive ? 'success' : 'neutral' }), sortable: true }
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
