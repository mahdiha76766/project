'use client';

import Link from 'next/link';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { DiscountBadge, ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { getProductDiscountInfo } from '@/lib/product/discount';
import type { HomeProduct } from '@/lib/shop/home-types';
import { useSalesConfig, useShowPrices } from '@/components/commerce/SalesProvider';

export function HomeProductCard({ product }: { product: HomeProduct }) {
  const { salesEnabled } = useSalesConfig();
  const showPrices = useShowPrices();
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-paper-200 bg-paper-50 shadow-soft">
      <Link href={`/products/${product.slug}`} className="relative aspect-square overflow-hidden bg-ink-900/5 p-6">
        <img
          src={product.images[0]}
          alt={product.name}
          className="mx-auto h-full w-[78%] rounded-full object-cover transition duration-700 group-hover:scale-105"
        />
        {showPrices && discount.hasDiscount ? <DiscountBadge label={discount.label} /> : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-black text-ink-900">{product.name}</h3>
        </Link>
        {product.shortDescription ? (
          <p className="mt-1 line-clamp-2 text-xs text-surface-500">{product.shortDescription}</p>
        ) : null}
        {showPrices ? (
          <ProductPriceWithDiscount
            className="mt-3"
            salePrice={displayPrice}
            originalPrice={discount.originalPrice}
            hasDiscount={showStrike}
            hasVariants={product.hasVariants}
          />
        ) : null}
        {salesEnabled ? (
          product.hasVariants ? (
            <Link href={`/products/${product.slug}`} className="ph-btn-outline mt-4 flex w-full py-2.5 text-sm">
              انتخاب نوع و خرید
            </Link>
          ) : (
            <AddToCartButton
              productId={product.id}
              variantId={defaultVariant?.id}
              className="ph-btn-primary mt-4 flex w-full py-2.5 text-sm"
            />
          )
        ) : (
          <Link href={`/products/${product.slug}`} className="mt-auto pt-4 text-sm font-bold text-ink-800">
            مشاهده اطلاعات محصول
          </Link>
        )}
      </div>
    </article>
  );
}
