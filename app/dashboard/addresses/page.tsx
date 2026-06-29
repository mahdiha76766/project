'use client';

import { useEffect, useState } from 'react';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading, DashPageHeader } from '@/components/shop/DashboardUI';
import { AddressMapPicker } from '@/components/shop/AddressMapPicker';
import { addressDisplayTitle } from '@/lib/dashboard/address-schema';

type Address = {
  _id: string;
  title?: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  plaque?: string;
  unit?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
};

const initial = {
  id: '',
  title: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
  plaque: '',
  unit: '',
  latitude: null as number | null,
  longitude: null as number | null,
  isDefault: false
};

export default function Page() {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/dashboard/addresses');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'خطا');
      setItems(d.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setMessage('');
    setMessageOk(false);
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      addressLine: form.addressLine.trim(),
      postalCode: form.postalCode.trim(),
      plaque: form.plaque.trim(),
      unit: form.unit.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      isDefault: form.isDefault
    };
    const method = form.id ? 'PUT' : 'POST';
    const url = form.id ? `/api/dashboard/addresses/${form.id}` : '/api/dashboard/addresses';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessageOk(false);
      setMessage(d.error || 'ذخیره آدرس ناموفق بود');
      return;
    }
    setMessageOk(true);
    setMessage(form.id ? 'آدرس ویرایش شد.' : 'آدرس با موفقیت اضافه شد.');
    setForm(initial);
    void load();
  };

  const editItem = (a: Address) => {
    setMessage('');
    setForm({
      id: a._id,
      title: a.title || '',
      recipientName: a.recipientName,
      phone: a.phone,
      province: a.province,
      city: a.city,
      addressLine: a.addressLine,
      postalCode: a.postalCode,
      plaque: a.plaque || '',
      unit: a.unit || '',
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      isDefault: a.isDefault
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <DashPageHeader
        title="آدرس‌های من"
        subtitle="برای هر آدرس یک عنوان بگذارید تا در تسویه حساب راحت‌تر انتخاب کنید"
      />

      <DashCard title={form.id ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="عنوان آدرس (مثلاً: خانه، محل کار، انبار)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="نام گیرنده"
            value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="شماره موبایل (۱۱ رقم، ۰۹...)"
            inputMode="numeric"
            maxLength={11}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="استان"
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="شهر"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm md:col-span-2"
            placeholder="آدرس کامل (حداقل ۵ کاراکتر)"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="کد پستی (۱۰ رقم)"
            inputMode="numeric"
            maxLength={10}
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="پلاک"
            value={form.plaque}
            onChange={(e) => setForm({ ...form, plaque: e.target.value })}
          />
          <input
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            placeholder="واحد"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 md:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            آدرس پیش‌فرض
          </label>
          <div className="md:col-span-2">
            <AddressMapPicker
              key={form.id ? `edit-${form.id}` : 'new-address'}
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(coords) =>
                setForm((prev) => ({
                  ...prev,
                  latitude: coords?.latitude ?? null,
                  longitude: coords?.longitude ?? null
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'افزودن آدرس'}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={() => setForm(initial)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
            >
              انصراف
            </button>
          ) : null}
        </div>
        {message ? (
          <p className={`mt-3 text-sm font-bold ${messageOk ? 'text-emerald-700' : 'text-red-600'}`}>{message}</p>
        ) : null}
      </DashCard>

      <DashCard title="لیست آدرس‌ها">
        {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length === 0 ? (
          <DashEmpty text="آدرسی ثبت نشده است." />
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-900">{addressDisplayTitle(a)}</p>
                        {a.isDefault ? <DashBadge label="پیش‌فرض" tone="amber" /> : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-700">گیرنده: {a.recipientName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {a.province}، {a.city} — {a.addressLine}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {a.phone} · کدپستی {a.postalCode}
                        {a.plaque ? ` · پلاک ${a.plaque}` : ''}
                        {a.unit ? ` · واحد ${a.unit}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => editItem(a)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      ویرایش
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/dashboard/addresses/${a._id}`, { method: 'DELETE' });
                        void load();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </div>
  );
}
