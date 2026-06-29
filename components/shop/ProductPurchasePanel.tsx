'use client';

import { useMemo, useState } from 'react';
import { Package, Tag } from 'lucide-react';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { cn } from '@/lib/utils/cn';

export type ProductVariantOption = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isDefault?: boolean;
};

export function ProductPurchasePanel({
  productId,
  productName,
  tags,
  variants,
  enableVariantPicker = false
}: {
  productId: string;
  productName: string;
  tags?: string[];
  variants: ProductVariantOption[];
  enableVariantPicker?: boolean;
}) {
  const defaultId = variants.find((v) => v.isDefault)?.id || variants[0]?.id || '';
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) || variants[0],
    [variants, selectedId]
  );

  if (!selected) return null;

  const finalPrice = selected.discountPrice ?? selected.price;
  const inStock = selected.stock > 0;
  const showVariantPicker = enableVariantPicker && variants.length > 0;

  return (
    <div>
      {showVariantPicker ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-surface-500">انتخاب نوع / اندازه</p>
          <div className="flex flex-wrap gap-2" role="listbox" aria-label="انتخاب نوع محصول">
            {variants.map((variant) => {
              const active = variant.id === selected.id;
              const available = variant.stock > 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={!available}
                  onClick={() => setSelectedId(variant.id)}
                  className={cn(
                    'min-w-[7.5rem] rounded-xl border px-4 py-2.5 text-sm font-bold transition',
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
                      : 'border-surface-200 bg-surface-0 text-surface-700 hover:border-brand-300',
                    !available && 'cursor-not-allowed opacity-45'
                  )}
                >
                  <span>{variant.name}</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-surface-500">
                    {(variant.discountPrice ?? variant.price).toLocaleString('fa-IR')} ریال
                    {!available ? ' — ناموجود' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${inStock ? 'bg-brand-100 text-brand-700' : 'bg-surface-100 text-surface-500'}`}>
          {inStock ? `موجود (${selected.stock.toLocaleString('fa-IR')} عدد)` : 'ناموجود'}
        </span>
        {selected.sku ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600">
            <Package className="h-3 w-3" />
            {selected.sku}
          </span>
        ) : null}
      </div>

      <p className="mt-6 text-3xl font-bold text-brand-600">
        {finalPrice.toLocaleString('fa-IR')}
        <span className="mr-1 text-sm font-normal text-surface-400">ریال</span>
      </p>
      {selected.discountPrice ? (
        <p className="mt-1 text-sm text-surface-400 line-through">{selected.price.toLocaleString('fa-IR')}</p>
      ) : null}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-surface-100 p-3 text-xs font-medium text-surface-600">
          <Package className="h-4 w-4 text-brand-600" /> بسته‌بندی بهداشتی
        </div>
        {showVariantPicker ? (
          <div className="flex items-center gap-2 rounded-xl bg-surface-100 p-3 text-xs font-medium text-surface-600">
            انتخاب شما: {selected.name}
          </div>
        ) : null}
      </div>

      <AddToCartButton
        productId={productId}
        variantId={variants.length > 0 ? selected.id : undefined}
        disabled={!inStock}
      />

      {tags?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Tag className="h-4 w-4 text-surface-400" />
          {tags.map((t) => (
            <span key={t} className="rounded-lg bg-surface-100 px-2.5 py-1 text-xs text-surface-600">{t}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
