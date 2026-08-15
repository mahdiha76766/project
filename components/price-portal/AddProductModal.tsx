'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { coercePriceToman } from '@/lib/shop/price-currency';

type VariantDraft = {
  id: string;
  weight: string;
  price: string;
};

function newVariant(): VariantDraft {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, weight: '', price: '' };
}

function parseDigits(value: string) {
  return value.replace(/[^\d]/g, '');
}

export function AddProductModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [variants, setVariants] = useState<VariantDraft[]>([newVariant()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setVariants([newVariant()]);
    setError('');
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saving]);

  if (!open) return null;

  const submit = async () => {
    const trimmedName = name.trim();
    // قیمت خالی / نامعتبر → ۰؛ حداقل یک واریانت نگه داشته می‌شود
    const rows = variants.map((v) => ({
      weight: v.weight.trim(),
      price: coercePriceToman(v.price)
    }));

    if (!trimmedName) {
      setError('نام محصول را وارد کنید');
      return;
    }
    if (!rows.length) {
      setError('حداقل یک واریانت لازم است');
      return;
    }

    setSaving(true);
    setError('');
    const res = await fetch('/api/price-portal/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name: trimmedName, variants: rows })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'افزودن محصول ناموفق بود');
      return;
    }

    await onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-product-title"
      dir="rtl"
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-[2px]"
        aria-label="بستن"
        onClick={() => {
          if (!saving) onClose();
        }}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0 text-right">
            <h2 id="add-product-title" className="text-base font-black text-neutral-900">
              محصول جدید
            </h2>
            <p className="mt-1 text-xs leading-5 text-neutral-400">
              در شیت site_prices و شیت قیمت اضافه می‌شود
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!saving) onClose();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-right text-xs font-medium text-neutral-500">
              نام محصول
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً روغن زیتون"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-100"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-right text-xs font-medium text-neutral-500">قیمت و وزن</p>
              <button
                type="button"
                onClick={() => setVariants((prev) => [...prev, newVariant()])}
                disabled={variants.length >= 12}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                ردیف جدید
              </button>
            </div>

            {variants.map((row, index) => (
              <div
                key={row.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400">
                    ردیف {index + 1}
                  </span>
                  {variants.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVariants((prev) => prev.filter((v) => v.id !== row.id))
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="حذف ردیف"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-neutral-400">وزن / نوع</label>
                    <input
                      type="text"
                      value={row.weight}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((v) =>
                            v.id === row.id ? { ...v, weight: e.target.value } : v
                          )
                        )
                      }
                      placeholder="مثلاً کیلو"
                      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-neutral-400">قیمت (تومان)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={row.price}
                      onChange={(e) =>
                        setVariants((prev) =>
                          prev.map((v) =>
                            v.id === row.id ? { ...v, price: parseDigits(e.target.value) } : v
                          )
                        )
                      }
                      placeholder="250000"
                      dir="ltr"
                      className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-left text-sm font-bold outline-none focus:border-neutral-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="text-right text-xs text-red-600">{error}</p> : null}
        </div>

        <div className="border-t border-neutral-100 px-5 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            افزودن محصول
          </button>
        </div>
      </div>
    </div>
  );
}
