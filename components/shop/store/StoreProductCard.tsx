import Link from 'next/link';
import { ArrowUpLeft, Check, Layers3, ShoppingBag, Sparkles } from 'lucide-react';
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-surface-200/80 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-brand-200 hover:shadow-card-hover">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[5/5.25] overflow-hidden bg-surface-100">
        <img
          src={resolveImage(product.images[0])}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        {showBadge ? <DiscountBadge label={badgeLabel} /> : null}
        {product.bestSeller ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/30 bg-brand-800/90 px-2.5 py-1 text-[10px] font-black text-white shadow-sm backdrop-blur">
            <Sparkles className="h-3 w-3 text-accent-300" /> پرفروش
          </span>
        ) : null}
        {product.hasVariants ? (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[10px] font-black text-brand-800 backdrop-blur-sm">
            <Layers3 className="h-3 w-3" /> چند انتخاب
          </span>
        ) : null}
        <span className="absolute bottom-3 left-3 flex h-10 w-10 translate-y-3 items-center justify-center rounded-full bg-white text-brand-800 opacity-0 shadow-lg transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpLeft className="h-4 w-4" /></span>
      </Link>
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className={cn('inline-flex items-center gap-1 text-[10px] font-black', inStock ? 'text-brand-600' : 'text-surface-400')}>
              {inStock ? <Check className="h-3 w-3" /> : null}{inStock ? 'آماده ارسال' : 'ناموجود'}
            </p>
            <span className="text-[10px] text-surface-400">محصول طبیعی</span>
          </div>
          <Link href={`/products/${product.slug}`} className="line-clamp-2 text-[15px] font-black leading-6 text-surface-900 transition hover:text-brand-700">
            {product.name}
          </Link>
          <p className="mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 text-surface-500">{product.shortDescription}</p>
        </div>
        <div className="mt-4 border-t border-surface-100 pt-4">
          <div className="flex items-center justify-between gap-2">
            <ProductPriceWithDiscount
              salePrice={salePrice}
              originalPrice={product.price}
              hasDiscount={hasStrike}
              hasVariants={product.hasVariants}
            />
            <Link
              href={`/products/${product.slug}`}
              aria-label={`مشاهده ${product.name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-lg shadow-brand-900/10 transition hover:bg-accent-500"
            >
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>
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
          {salePrice.toLocaleString('fa-IR')} تومان
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
                  {(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان
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
