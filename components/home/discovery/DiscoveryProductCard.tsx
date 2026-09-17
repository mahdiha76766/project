'use client';

import Link from 'next/link';
import { ArrowUpLeft, Flame, ShoppingBag, Sparkles } from 'lucide-react';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { DiscountBadge, ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { getProductDiscountInfo } from '@/lib/product/discount';
import { cn } from '@/lib/utils/cn';
import type { HomeProduct } from '@/lib/shop/home-types';

type Variant = 'default' | 'spotlight' | 'compact' | 'editorial';

export function DiscoveryProductCard({
  product,
  variant = 'default',
  rank,
  className
}: {
  product: HomeProduct;
  variant?: Variant;
  rank?: number;
  className?: string;
}) {
  const discount = getProductDiscountInfo({
    price: product.price,
    discountPrice: product.discountPrice,
    variants: product.variants?.map((v) => ({
      name: v.name,
      price: v.price,
      discountPrice: v.discountPrice,
      stock: v.stock,
      isDefault: v.isDefault
    }))
  });

  const displayPrice = product.hasVariants ? (product.minPrice ?? discount.salePrice) : discount.salePrice;
  const showStrike =
    product.hasVariants ? discount.hasDiscount && discount.salePrice < discount.originalPrice : discount.hasDiscount;
  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
  const isSpotlight = variant === 'spotlight';
  const isEditorial = variant === 'editorial';
  const isCompact = variant === 'compact';

  return (
    <article
      className={cn(
        'group relative flex h-full overflow-hidden border border-surface-200/80 bg-[#fffefb] transition-all duration-500 ease-out',
        isSpotlight
          ? 'flex-col rounded-[1.75rem] sm:flex-row sm:rounded-[2rem] hover:border-brand-200 hover:shadow-card-hover'
          : isEditorial
            ? 'flex-col rounded-[1.5rem] hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-card-hover'
            : isCompact
              ? 'flex-row rounded-2xl hover:border-brand-200 hover:shadow-card'
              : 'flex-col rounded-[1.6rem] hover:-translate-y-2 hover:border-brand-200 hover:shadow-card-hover',
        className
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className={cn(
          'relative overflow-hidden bg-surface-100',
          isSpotlight
            ? 'aspect-[4/5] sm:aspect-auto sm:w-[48%] sm:min-h-[22rem]'
            : isCompact
              ? 'aspect-square w-[7.25rem] shrink-0 sm:w-32'
              : isEditorial
                ? 'aspect-[4/5]'
                : 'aspect-[5/5.4]'
        )}
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="discovery-image-sheen absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/35 via-transparent to-transparent opacity-70 transition group-hover:opacity-90" />

        {discount.hasDiscount ? <DiscountBadge label={discount.label} /> : null}

        {typeof rank === 'number' ? (
          <span className="absolute right-3 top-3 z-10 inline-flex h-9 min-w-9 items-center justify-center rounded-2xl bg-brand-900/90 px-2.5 text-sm font-black text-white backdrop-blur">
            {(rank + 1).toLocaleString('fa-IR')}
          </span>
        ) : product.bestSeller ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-white/25 bg-brand-800/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent-300" /> پرفروش
          </span>
        ) : product.isNew ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-emerald-200/40 bg-emerald-700/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
            جدید
          </span>
        ) : null}

        {!isCompact && product.hasVariants ? (
          <span className="absolute bottom-3 right-3 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[10px] font-black text-brand-800 backdrop-blur-sm">
            چند انتخاب
          </span>
        ) : null}

        {!isCompact ? (
          <span className="absolute bottom-3 left-3 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-brand-800 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpLeft className="h-4 w-4" />
          </span>
        ) : null}
      </Link>

      <div
        className={cn(
          'flex flex-1 flex-col',
          isSpotlight ? 'justify-center p-5 sm:p-8' : isCompact ? 'justify-center p-3.5' : 'p-4 sm:p-5'
        )}
      >
        {isSpotlight && product.soldCount ? (
          <p className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-[11px] font-black text-accent-600">
            <Flame className="h-3.5 w-3.5" />
            {product.soldCount.toLocaleString('fa-IR')}+ خرید موفق
          </p>
        ) : null}

        <Link href={`/products/${product.slug}`}>
          <h3
            className={cn(
              'font-black leading-7 text-surface-900 transition group-hover:text-brand-700',
              isSpotlight ? 'text-xl sm:text-2xl' : isCompact ? 'line-clamp-2 text-sm leading-6' : 'line-clamp-2 text-[15px] leading-6'
            )}
          >
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && !isCompact ? (
          <p className={cn('mt-2 text-xs leading-6 text-surface-500', isSpotlight ? 'line-clamp-3 max-w-md sm:text-sm' : 'line-clamp-2 min-h-10')}>
            {product.shortDescription}
          </p>
        ) : null}

        {!isSpotlight && product.soldCount ? (
          <p className="mt-2 text-[10px] font-bold text-surface-400">
            {product.soldCount.toLocaleString('fa-IR')} فروش
          </p>
        ) : null}

        <div
          className={cn(
            'mt-auto flex items-end justify-between gap-3',
            isSpotlight ? 'pt-6' : isCompact ? 'pt-3' : 'border-t border-surface-100 pt-4'
          )}
        >
          <ProductPriceWithDiscount
            salePrice={displayPrice}
            originalPrice={discount.originalPrice}
            hasDiscount={showStrike}
            hasVariants={product.hasVariants}
          />
          {product.hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              aria-label="انتخاب نوع محصول"
              className={cn(
                'flex shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-lg shadow-brand-900/10 transition hover:bg-accent-500',
                isCompact ? 'h-10 w-10' : 'h-11 w-11',
                isSpotlight && 'h-12 w-auto gap-2 px-5'
              )}
            >
              {isSpotlight ? <span className="text-xs font-black">مشاهده محصول</span> : <ShoppingBag className="h-4 w-4" />}
            </Link>
          ) : isSpotlight ? (
            <AddToCartButton
              productId={product.id}
              variantId={defaultVariant?.id}
              className="site-btn-primary !mt-0 h-12 shrink-0 rounded-2xl px-5 text-xs"
            />
          ) : (
            <AddToCartButton productId={product.id} variantId={defaultVariant?.id} compact />
          )}
        </div>
      </div>
    </article>
  );
}
