import Link from 'next/link';
import type { ShopProduct } from '@/types/shop';

export const ProductCard = ({ product }: { product: ShopProduct }) => {
  const finalPrice = product.discountPrice ?? product.price;

  return (
    <Link href={`/products/${product.slug}`} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="mb-3 h-36 rounded-xl bg-amber-50" />
      <h3 className="font-bold text-amber-900">{product.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{product.shortDescription}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-bold text-amber-700">{finalPrice.toLocaleString('fa-IR')} تومان</span>
        {product.discountPrice ? <span className="text-xs line-through text-slate-400">{product.price.toLocaleString('fa-IR')}</span> : null}
      </div>
    </Link>
  );
};
