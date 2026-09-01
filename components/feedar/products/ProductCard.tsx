'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FpBadge } from '@/components/feedar/ui/Badge';
import { ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { useSalesConfig, useShowPrices } from '@/components/commerce/SalesProvider';
import type { ShopProduct } from '@/types/shop';
import { resolveImage } from '@/lib/shop/resolve-image';

export function FeedarProductCard({
  product,
  categoryLabel
}: {
  product: ShopProduct;
  categoryLabel?: string;
}) {
  const { salesEnabled } = useSalesConfig();
  const showPrices = useShowPrices();
  const dosage = product.attributes?.usage || product.attributes?.form || '';
  const salePrice = product.discountPrice ?? product.price;
  const hasStrike = Boolean(product.discountPrice && product.discountPrice < product.price);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-paper-200 bg-paper-50 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden bg-ink-900/5 p-6">
        <div className="ph-grid absolute inset-0 opacity-40" />
        <div className="relative mx-auto aspect-square w-[78%] overflow-hidden rounded-full border-[6px] border-paper-50 shadow-card">
          <img
            src={resolveImage(product.images[0])}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        {product.bestSeller ? (
          <span className="absolute right-4 top-4">
            <FpBadge tone="success">منتخب علمی</FpBadge>
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          {categoryLabel || product.category ? <FpBadge>{categoryLabel || product.category}</FpBadge> : null}
          {dosage ? <FpBadge tone="neutral">{dosage}</FpBadge> : null}
        </div>
        <h3 className="mt-3 text-base font-black leading-7 text-ink-900">
          <Link href={`/products/${product.slug}`} className="hover:text-gold-600">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-surface-500">{product.shortDescription}</p>
        {showPrices ? (
          <ProductPriceWithDiscount
            className="mt-4"
            salePrice={salePrice}
            originalPrice={product.price}
            hasDiscount={hasStrike}
            hasVariants={product.hasVariants}
          />
        ) : null}
        <Link
          href={`/products/${product.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-ink-800 hover:text-gold-600"
        >
          {salesEnabled ? 'مشاهده و خرید' : 'مشاهده اطلاعات محصول'}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
