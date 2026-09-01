'use client';

import { useMemo, useState } from 'react';
import { Package, Tag } from 'lucide-react';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { cn } from '@/lib/utils/cn';
import { useSalesConfig, useShowPrices } from '@/components/commerce/SalesProvider';

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
  const { salesEnabled } = useSalesConfig();
  const showPrices = useShowPrices();
  const defaultId = variants.find((v) => v.isDefault)?.id || variants[0]?.id || '';
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) || variants[0],
    [variants, selectedId]
  );

  if (!salesEnabled || !selected) return null;

  const finalPrice = selected.discountPrice ?? selected.price;
  const inStock = selected.stock > 0;
  const showVariantPicker = enableVariantPicker && variants.length > 0;

  return (
    <div>
      {showVariantPicker ? (
        <div>
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
                    'min-w-[7.5rem] rounded-full border px-4 py-2.5 text-sm font-bold transition',
                    active ? 'border-ink-900 bg-ink-900 text-paper-50' : 'border-paper-200 bg-paper-50 text-ink-800',
                    !available && 'cursor-not-allowed opacity-45'
                  )}
                >
                  <span>{variant.name}</span>
                  {showPrices ? (
                    <span className="mt-0.5 block text-[11px] font-normal opacity-80">
                      {(variant.discountPrice ?? variant.price).toLocaleString('fa-IR')} تومان
                      {!available ? ' — ناموجود' : ''}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${inStock ? 'bg-brand-100 text-brand-700' : 'bg-paper-100 text-surface-500'}`}>
          {inStock ? 'موجود' : 'ناموجود'}
        </span>
        {selected.sku ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-100 px-3 py-1 text-xs font-medium text-surface-600">
            <Package className="h-3 w-3" />
            {selected.sku}
          </span>
        ) : null}
      </div>

      {showPrices ? (
        <>
          <p className="mt-6 text-3xl font-black text-ink-900">
            {finalPrice.toLocaleString('fa-IR')}
            <span className="mr-1 text-sm font-normal text-surface-400">تومان</span>
          </p>
          {selected.discountPrice ? (
            <p className="mt-1 text-sm text-surface-400 line-through">{selected.price.toLocaleString('fa-IR')}</p>
          ) : null}
        </>
      ) : null}

      <AddToCartButton
        productId={productId}
        variantId={variants.length > 0 ? selected.id : undefined}
        disabled={!inStock}
      />

      {tags?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Tag className="h-4 w-4 text-surface-400" />
          {tags.map((t) => (
            <span key={`${productName}-${t}`} className="rounded-full bg-paper-100 px-2.5 py-1 text-xs text-surface-600">{t}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
