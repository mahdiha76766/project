'use client';

import { useMemo, useState } from 'react';
import { Droplets, Leaf, Package, Shield, Tag } from 'lucide-react';
import { ProductMediaGallery } from '@/components/shop/ProductMediaGallery';
import { DiscountBadge } from '@/components/shop/DiscountBadge';
import { getVariantDiscountInfo } from '@/lib/product/discount';
import type { GalleryMediaItem } from '@/lib/media/gallery';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { RichHtmlContent } from '@/components/shop/RichHtmlContent';
import { getVariantSpecEntries } from '@/lib/product/specs';
import { cn } from '@/lib/utils/cn';

export type ProductVariantOption = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  isDefault?: boolean;
};

type ProductBase = {
  usageType?: string;
  weight?: number;
  weightUnit?: string;
  containerSize?: string;
  attributes?: Record<string, string>;
};

export function ProductDetailClient({
  productId,
  productName,
  media,
  shortDescription,
  tags,
  variants,
  productBase,
  fullDescription,
  isFeatured,
  enableVariantPicker = false
}: {
  productId: string;
  productName: string;
  media: GalleryMediaItem[];
  shortDescription?: string;
  tags?: string[];
  variants: ProductVariantOption[];
  productBase: ProductBase;
  fullDescription?: string;
  isFeatured?: boolean;
  enableVariantPicker?: boolean;
}) {
  const defaultId = variants.find((v) => v.isDefault)?.id || variants[0]?.id || '';
  const [selectedId, setSelectedId] = useState(defaultId);

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) || variants[0],
    [variants, selectedId]
  );

  if (!selected) return null;

  const variantDiscount = getVariantDiscountInfo(selected);
  const finalPrice = variantDiscount.salePrice;
  const inStock = selected.stock > 0;
  const showVariantPicker = enableVariantPicker && variants.length > 0;
  const specEntries = getVariantSpecEntries(selected, productBase);

  return (
    <>
      <div className="grid lg:grid-cols-2">
        <div className="p-6">
          <ProductMediaGallery
            media={media}
            name={productName}
            discountLabel={variantDiscount.hasDiscount ? `${variantDiscount.percent.toLocaleString('fa-IR')}٪` : undefined}
          />
        </div>
        <div className="border-t border-surface-200 p-6 lg:border-r lg:border-t-0">
          <div className="flex flex-wrap gap-2">
            {variantDiscount.hasDiscount ? (
              <DiscountBadge label={`${variantDiscount.percent.toLocaleString('fa-IR')}٪ تخفیف`} variant="pill" size="md" className="static" />
            ) : null}
            {isFeatured ? (
              <span className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-600">پرفروش</span>
            ) : null}
          </div>
          {shortDescription ? (
            <p className="mt-4 text-sm leading-7 text-surface-600">{shortDescription}</p>
          ) : null}

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
          {variantDiscount.hasDiscount ? (
            <p className="mt-1 text-sm text-surface-400 line-through">{selected.price.toLocaleString('fa-IR')} ریال</p>
          ) : null}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-surface-100 p-3 text-xs font-medium text-surface-600">
              <Shield className="h-4 w-4 text-brand-600" /> ضمانت اصالت
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-100 p-3 text-xs font-medium text-surface-600">
              <Package className="h-4 w-4 text-brand-600" />
              {showVariantPicker ? `انتخاب شما: ${selected.name}` : 'بسته‌بندی بهداشتی'}
            </div>
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
      </div>

      {specEntries.length > 0 ? (
        <div className="border-t border-surface-200 p-6">
          <h2 className="flex items-center gap-2 font-bold text-surface-900">
            <Package className="h-5 w-5 text-brand-600" />
            مشخصات {showVariantPicker ? `— ${selected.name}` : 'محصول'}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specEntries.map((entry) => (
              <div key={`${selected.id}-${entry.label}`} className="rounded-xl border border-surface-100 bg-surface-50 p-3 transition">
                <p className="text-xs font-bold text-surface-500">{entry.label}</p>
                <p className="mt-1 text-sm font-semibold text-surface-800">{entry.value}</p>
              </div>
            ))}
          </div>
          {productBase.usageType === 'EDIBLE' || productBase.usageType === 'BOTH' ? (
            <p className="mt-4 inline-flex items-center gap-1 text-xs text-brand-700">
              <Leaf className="h-3.5 w-3.5" />
              مناسب مصرف خوراکی
            </p>
          ) : null}
          {productBase.attributes?.extraction ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-surface-500">
              <Droplets className="h-3.5 w-3.5" />
              {productBase.attributes.extraction}
            </p>
          ) : null}
        </div>
      ) : null}

      {fullDescription ? (
        <div className="border-t border-surface-200 p-6">
          <h2 className="font-bold text-surface-900">توضیحات</h2>
          <div className="mt-3">
            <RichHtmlContent html={fullDescription} className="text-surface-600" />
          </div>
        </div>
      ) : null}
    </>
  );
}
