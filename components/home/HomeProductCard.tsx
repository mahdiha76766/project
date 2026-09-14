'use client';

import Link from 'next/link';
import { ArrowUpLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { DiscountBadge, ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { getProductDiscountInfo } from '@/lib/product/discount';
import type { HomeProduct } from '@/lib/shop/home-types';

export function HomeProductCard({ product }: { product: HomeProduct }) {
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
  const showStrike = product.hasVariants ? discount.hasDiscount && discount.salePrice < discount.originalPrice : discount.hasDiscount;
  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-surface-200/80 bg-[#fffefb] transition-all duration-500 ease-out hover:-translate-y-2 hover:border-brand-200 hover:shadow-card-hover">
      <Link href={`/products/${product.slug}`} className="relative aspect-[5/5.4] overflow-hidden bg-surface-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {discount.hasDiscount ? <DiscountBadge label={discount.label} /> : null}
        {product.bestSeller ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-brand-800/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent-300" /> پرفروش
          </span>
        ) : null}
        {product.hasVariants ? (
          <span className="absolute bottom-3 right-3 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[10px] font-black text-brand-800 backdrop-blur-sm">
            چند انتخاب
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-brand-800 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpLeft className="h-4 w-4" /></span>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-[15px] font-black leading-6 text-surface-900 transition group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-surface-500">{product.shortDescription}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-surface-100 pt-4">
          <ProductPriceWithDiscount
            salePrice={displayPrice}
            originalPrice={discount.originalPrice}
            hasDiscount={showStrike}
            hasVariants={product.hasVariants}
          />
          {product.hasVariants ? (
            <Link href={`/products/${product.slug}`} aria-label="انتخاب نوع محصول" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-lg shadow-brand-900/10 transition hover:bg-accent-500">
              <ShoppingBag className="h-4 w-4" />
            </Link>
          ) : (
            <AddToCartButton productId={product.id} variantId={defaultVariant?.id} compact />
          )}
        </div>
      </div>
    </article>
  );
}
