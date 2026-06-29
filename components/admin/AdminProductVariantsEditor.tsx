'use client';

import { Plus, Trash2 } from 'lucide-react';
import { FieldLabel, SelectInput, TextInput } from '@/components/admin/ui';
import { weightUnitOptions } from '@/lib/product/specs';

export type VariantFormRow = {
  _id?: string;
  name: string;
  sku: string;
  price: string;
  discountPrice: string;
  stock: string;
  weight: string;
  weightUnit: string;
  containerSize: string;
  isDefault: boolean;
};

export const emptyVariantRow = (): VariantFormRow => ({
  name: '',
  sku: '',
  price: '',
  discountPrice: '',
  stock: '',
  weight: '',
  weightUnit: 'g',
  containerSize: '',
  isDefault: false
});

export function AdminProductVariantsEditor({
  variants,
  onChange
}: {
  variants: VariantFormRow[];
  onChange: (rows: VariantFormRow[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<VariantFormRow>) => {
    const next = variants.map((row, i) => (i === index ? { ...row, ...patch } : row));
    if (patch.isDefault) {
      onChange(next.map((row, i) => ({ ...row, isDefault: i === index })));
      return;
    }
    onChange(next);
  };

  const addRow = () => onChange([...variants, emptyVariantRow()]);

  const removeRow = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    if (next.length && !next.some((r) => r.isDefault)) next[0].isDefault = true;
    onChange(next);
  };

  return (
    <div className="md:col-span-2 xl:col-span-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <FieldLabel text="انواع / اندازه‌های محصول" />
          <p className="mt-1 text-xs text-slate-500">
            مثال: روغن آرگان — «۱ لیتر» و «۵۰۰ میلی‌لیتر» با قیمت و موجودی جداگانه
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
        >
          <Plus className="h-4 w-4" />
          افزودن نوع
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-500">
          اگر محصول فقط یک نوع دارد، فیلدهای قیمت و موجودی بالا کافی است. برای چند نوع، اینجا اضافه کنید.
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((row, index) => (
            <div key={row._id || `new-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="radio"
                    name="default-variant"
                    checked={row.isDefault}
                    onChange={() => updateRow(index, { isDefault: true })}
                    className="h-4 w-4 text-amber-600"
                  />
                  نوع {index + 1}
                  {row.isDefault ? <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">پیش‌فرض</span> : null}
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <FieldLabel text="نام نوع" />
                  <TextInput
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    placeholder="مثلاً ۱ لیتر"
                  />
                </div>
                <div>
                  <FieldLabel text="SKU" />
                  <TextInput dir="ltr" className="text-right" value={row.sku} onChange={(e) => updateRow(index, { sku: e.target.value })} />
                </div>
                <div>
                  <FieldLabel text="قیمت (ریال)" />
                  <TextInput inputMode="numeric" dir="ltr" className="text-right" value={row.price} onChange={(e) => updateRow(index, { price: e.target.value })} />
                </div>
                <div>
                  <FieldLabel text="قیمت با تخفیف" />
                  <TextInput inputMode="numeric" dir="ltr" className="text-right" value={row.discountPrice} onChange={(e) => updateRow(index, { discountPrice: e.target.value })} />
                </div>
                <div>
                  <FieldLabel text="موجودی" />
                  <TextInput inputMode="numeric" dir="ltr" className="text-right" value={row.stock} onChange={(e) => updateRow(index, { stock: e.target.value })} />
                </div>
                <div>
                  <FieldLabel text="اندازه / حجم" />
                  <TextInput value={row.containerSize} onChange={(e) => updateRow(index, { containerSize: e.target.value })} placeholder="مثلاً ۱ لیتر" />
                </div>
                <div>
                  <FieldLabel text="وزن" />
                  <TextInput inputMode="numeric" dir="ltr" className="text-right" value={row.weight} onChange={(e) => updateRow(index, { weight: e.target.value })} />
                </div>
                <div>
                  <FieldLabel text="واحد وزن" />
                  <SelectInput value={row.weightUnit} onChange={(e) => updateRow(index, { weightUnit: e.target.value })}>
                    {weightUnitOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </SelectInput>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
