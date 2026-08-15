'use client';

import { useState } from 'react';
import { Clock, Hash, Tag, Truck } from 'lucide-react';
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
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { labelOf, shippingCodeOptions, SHIPPING_CODE_LABELS } from '@/lib/admin/labels';
import { useAdminList } from '@/hooks/useAdminList';

type Ship = {
  _id: string;
  code: string;
  name: string;
  baseCost: number;
  costPerKg?: number;
  estimatedDays: number;
  cityOnly: boolean;
  freeAboveAmount: number;
  allowShippingOnDelivery?: boolean;
  isActive: boolean;
};

const emptyForm = {
  id: '',
  code: '',
  name: '',
  baseCost: '',
  costPerKg: '0',
  estimatedDays: '1',
  freeAboveAmount: '0',
  cityOnly: false,
  allowShippingOnDelivery: true,
  isActive: true
};

export default function AdminShippingPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<Ship>('/api/admin/shipping');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => setForm(emptyForm);

  const save = async () => {
    setSaving(true);
    setFormError('');
    setMessage('');
    const payload = {
      code: form.code,
      name: form.name.trim(),
      baseCost: Number(form.baseCost || 0),
      costPerKg: Number(form.costPerKg || 0),
      estimatedDays: Number(form.estimatedDays || 1),
      freeAboveAmount: Number(form.freeAboveAmount || 0),
      cityOnly: form.cityOnly,
      allowShippingOnDelivery: form.allowShippingOnDelivery,
      isActive: form.isActive
    };
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/admin/shipping/${form.id}` : '/api/admin/shipping';
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
    setMessage(form.id ? 'روش ارسال ویرایش شد.' : 'روش ارسال ایجاد شد.');
    resetForm();
    reload();
  };

  const editItem = (s: Ship) => {
    setFormError('');
    setMessage('');
    setForm({
      id: s._id,
      code: s.code,
      name: s.name,
      baseCost: String(s.baseCost),
      costPerKg: String(s.costPerKg || 0),
      estimatedDays: String(s.estimatedDays),
      freeAboveAmount: String(s.freeAboveAmount || 0),
      cityOnly: s.cityOnly,
      allowShippingOnDelivery: s.allowShippingOnDelivery ?? s.code !== 'POST',
      isActive: s.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async (id: string) => {
    if (!confirm('این روش ارسال حذف شود؟')) return;
    const { ok, error: deleteError } = await adminFetch(`/api/admin/shipping/${id}`, { method: 'DELETE' });
    if (!ok) setFormError(deleteError);
    else {
      setMessage('روش ارسال حذف شد.');
      reload();
    }
  };

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="مدیریت روش‌های ارسال"
        description="برای روش‌هایی مثل تیپاکس، هزینه ارسال توسط مشتری مستقیم به پیک پرداخت می‌شود و در فاکتور فروشگاه نمی‌آید"
      />

      <AdminCard title={form.id ? 'ویرایش روش ارسال' : 'ایجاد روش ارسال'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <FieldLabel text="کد روش" />
            <SelectInput
              value={form.code}
              onChange={(e) => {
                const code = e.target.value;
                setForm({
                  ...form,
                  code,
                  allowShippingOnDelivery: code === 'POST' ? false : true
                });
              }}
            >
              <option value="">انتخاب کنید</option>
              {shippingCodeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </SelectInput>
          </div>
          <div><FieldLabel text="نام نمایشی" /><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><FieldLabel text="هزینه پایه (تومان)" /><TextInput inputMode="numeric" value={form.baseCost} onChange={(e) => setForm({ ...form, baseCost: e.target.value })} dir="ltr" className="text-right" /></div>
          {form.code === 'POST' ? (
            <div><FieldLabel text="هزینه هر کیلو (تومان) — پست" /><TextInput inputMode="numeric" value={form.costPerKg} onChange={(e) => setForm({ ...form, costPerKg: e.target.value })} dir="ltr" className="text-right" /></div>
          ) : null}
          <div><FieldLabel text="زمان تحویل (روز)" /><TextInput inputMode="numeric" value={form.estimatedDays} onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })} dir="ltr" className="text-right" /></div>
          <div><FieldLabel text="ارسال رایگان از مبلغ (تومان)" /><TextInput inputMode="numeric" value={form.freeAboveAmount} onChange={(e) => setForm({ ...form, freeAboveAmount: e.target.value })} dir="ltr" className="text-right" /></div>
          <AdminCheckbox label="فقط ارسال شهری" checked={form.cityOnly} onChange={(cityOnly) => setForm({ ...form, cityOnly })} />
          <AdminCheckbox
            label="هزینه ارسال توسط مشتری به پیک (خارج از فاکتور)"
            checked={form.allowShippingOnDelivery}
            onChange={(allowShippingOnDelivery) => setForm({ ...form, allowShippingOnDelivery })}
          />
          <AdminCheckbox label="فعال" checked={form.isActive} onChange={(isActive) => setForm({ ...form, isActive })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton onClick={save} disabled={saving}>{saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ایجاد روش'}</AdminPrimaryButton>
          {form.id ? <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">انصراف</button> : null}
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        {message ? <div className="mt-3"><AdminAlert tone="success">{message}</AdminAlert></div> : null}
      </AdminCard>

      <AdminCard title="لیست روش‌های ارسال">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(s) => s._id}
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          columns={[
            {
              id: 'code',
              header: 'کد',
              icon: <Hash className="h-3.5 w-3.5" />,
              accessor: (s) => labelOf(SHIPPING_CODE_LABELS, s.code),
              sortable: true,
              searchable: true
            },
            {
              id: 'name',
              header: 'نام',
              icon: <Truck className="h-3.5 w-3.5" />,
              accessor: (s) => s.name,
              sortable: true,
              searchable: true
            },
            {
              id: 'baseCost',
              header: 'هزینه',
              type: 'currency',
              accessor: (s) => s.baseCost,
              sortable: true
            },
            {
              id: 'estimatedDays',
              header: 'زمان',
              icon: <Clock className="h-3.5 w-3.5" />,
              render: (s) => `${s.estimatedDays.toLocaleString('fa-IR')} روز`,
              sortable: true,
              accessor: (s) => s.estimatedDays
            },
            {
              id: 'freeAboveAmount',
              header: 'ارسال رایگان از',
              render: (s) => (s.freeAboveAmount ? `${s.freeAboveAmount.toLocaleString('fa-IR')} تومان` : '-'),
              sortable: true,
              accessor: (s) => s.freeAboveAmount
            },
            {
              id: 'isActive',
              header: 'وضعیت',
              icon: <Tag className="h-3.5 w-3.5" />,
              type: 'badge',
              badge: (s) => ({ label: s.isActive ? 'فعال' : 'غیرفعال', tone: s.isActive ? 'success' : 'neutral' }),
              sortable: true
            }
          ]}
          actions={[
            { id: 'edit', label: 'ویرایش', icon: 'edit', tone: 'primary', onClick: editItem },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (s) => removeItem(s._id) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
