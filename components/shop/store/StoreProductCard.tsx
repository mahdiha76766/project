import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { DiscountBadge, ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { getProductDiscountInfo } from '@/lib/product/discount';
import type { ShopProduct } from '@/types/shop';
import { resolveImage } from '@/lib/shop/resolve-image';
import { cn } from '@/lib/utils/cn';

export function StoreProductCard({ product }: { product: ShopProduct }) {
  const salePrice = product.discountPrice ?? product.price;
  const hasStrike = Boolean(product.discountPrice && product.discountPrice < product.price);
  const showBadge = Boolean(product.discountLabel || hasStrike);
  const badgeLabel =
    product.discountLabel ||
    (hasStrike ? `${Math.round(((product.price - salePrice) / product.price) * 100).toLocaleString('fa-IR')}٪` : '');
  const inStock = product.stock > 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-surface-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-brand-500/20 hover:shadow-card-hover transform translate-z-0 will-change-transform flex flex-col h-full">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-surface-100">
        <img
          src={resolveImage(product.images[0])}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {showBadge ? <DiscountBadge label={badgeLabel} /> : null}
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
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-bold text-surface-900 hover:text-brand-700">
            {product.name}
          </Link>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-surface-500">{product.shortDescription}</p>
        </div>
        <div className="mt-4">
          <div className="flex items-end justify-between gap-2">
            <ProductPriceWithDiscount
              salePrice={salePrice}
              originalPrice={product.price}
              hasDiscount={hasStrike}
              hasVariants={product.hasVariants}
            />
            <Link
              href={`/products/${product.slug}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-600 hover:text-white"
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
          <p className={cn('mt-2 text-[11px] font-medium', inStock ? 'text-brand-600' : 'text-surface-400')}>
            {inStock ? 'موجود' : 'ناموجود'}
          </p>
        </div>
      </div>
    </article>
  );
}

export function StoreProductCompact({
  slug,
  name,
  price,
  discountPrice,
  image
}: {
  slug: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
}) {
  const discount = getProductDiscountInfo({ price, discountPrice });
  const salePrice = discountPrice ?? price;

  return (
    <Link
      href={`/products/${slug}`}
      className="flex gap-3 rounded-xl p-2 transition hover:bg-surface-100"
    >
      <div className="relative shrink-0">
        <img src={resolveImage(image)} alt={name} className="h-14 w-14 rounded-lg object-cover" />
        {discount.hasDiscount ? (
          <span className="absolute -left-1 -top-1 rounded-md bg-rose-600 px-1 py-0.5 text-[9px] font-bold text-white">
            {discount.label}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold text-surface-900">{name}</p>
        <p className="mt-0.5 text-xs font-bold text-brand-600">
          {salePrice.toLocaleString('fa-IR')} ریال
        </p>
        {discount.hasDiscount ? (
          <p className="text-[10px] text-surface-400 line-through">{price.toLocaleString('fa-IR')}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function StoreRelatedProducts({
  title,
  products
}: {
  title: string;
  products: Array<{ _id?: unknown; slug: string; name: string; price: number; discountPrice?: number; images?: string[] }>;
}) {
  if (!products.length) return null;
  return (
    <section className="rounded-2xl border border-surface-200 bg-surface-0 p-6">
      <h3 className="font-bold text-surface-900">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const discount = getProductDiscountInfo({ price: p.price, discountPrice: p.discountPrice });
          return (
            <Link
              key={String(p._id)}
              href={`/products/${p.slug}`}
              className="group relative overflow-hidden rounded-xl border border-surface-200 transition hover:shadow-soft"
            >
              <div className="relative">
                <img src={resolveImage(p.images?.[0])} alt={p.name} className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" />
                {discount.hasDiscount ? (
                  <DiscountBadge label={discount.label} size="sm" className="left-2 top-2" />
                ) : null}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-semibold text-surface-900">{p.name}</p>
                <p className="mt-1 text-xs font-bold text-brand-600">
                  {(p.discountPrice ?? p.price).toLocaleString('fa-IR')} ریال
                </p>
                {discount.hasDiscount ? (
                  <p className="text-[10px] text-surface-400 line-through">{p.price.toLocaleString('fa-IR')}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
