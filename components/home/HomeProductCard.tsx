'use client';

import Link from 'next/link';
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-500/20 hover:shadow-card-hover transform translate-z-0 will-change-transform h-full">
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-surface-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {discount.hasDiscount ? <DiscountBadge label={discount.label} /> : null}
        {product.bestSeller ? (
          <span className="absolute right-3 top-3 rounded-md bg-accent-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            پرفروش
          </span>
        ) : null}
        {product.hasVariants ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-brand-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            چند نوع
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-bold text-surface-900 group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-xs text-surface-500">{product.shortDescription}</p>
        ) : null}
        <ProductPriceWithDiscount
          className="mt-3"
          salePrice={displayPrice}
          originalPrice={discount.originalPrice}
          hasDiscount={showStrike}
          hasVariants={product.hasVariants}
        />
        {product.hasVariants ? (
          <Link
            href={`/products/${product.slug}`}
            className="site-btn-outline mt-3 flex w-full items-center justify-center py-2.5 text-sm"
          >
            انتخاب نوع و خرید
          </Link>
        ) : (
          <AddToCartButton
            productId={product.id}
            variantId={defaultVariant?.id}
            className="site-btn-primary mt-3 flex w-full items-center justify-center gap-2 py-2.5 text-sm"
          />
        )}
      </div>
    </article>
  );
}
