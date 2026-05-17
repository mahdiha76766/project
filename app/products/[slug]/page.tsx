import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/shop/ProductCard';
import { products } from '@/lib/data/shop-data';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return buildMetadata('محصول یافت نشد', 'محصول موردنظر موجود نیست');
  return buildMetadata(product.name, product.shortDescription);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const similar = products.filter((p) => p.category === product.category && p.id !== product.id);
  const complement = products.filter((p) => p.id !== product.id).slice(0, 2);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-amber-50 p-8">گالری تصاویر محصول</div>
        <div>
          <h1 className="text-2xl font-black text-amber-900">{product.name}</h1>
          <p className="mt-2 text-slate-600">{product.shortDescription}</p>
          <p className="mt-4 text-xl font-bold">{(product.discountPrice ?? product.price).toLocaleString('fa-IR')} تومان</p>
          <p className="mt-2 text-sm">موجودی: {product.stock > 0 ? 'موجود' : 'ناموجود'}</p>
          <div className="mt-4 flex gap-3"><button className="rounded-xl bg-amber-800 px-4 py-2 text-white">افزودن به سبد خرید</button><button className="rounded-xl border px-4 py-2">خرید سریع</button></div>
          <div className="mt-5 text-sm leading-7 text-slate-700"><p>{product.fullDescription}</p><p>ویژگی‌ها: {Object.entries(product.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ')}</p><p>روش مصرف: مطابق نیاز روزانه.</p><p>شرایط نگهداری: دور از نور مستقیم آفتاب.</p><p>تاریخ تولید: {product.productionDate ?? '-'}</p><p>تاریخ انقضا: {product.expiryDate ?? '-'}</p></div>
        </div>
      </div>
      <section className="mt-10"><h2 className="mb-4 text-xl font-bold">محصولات مشابه</h2><div className="grid gap-4 md:grid-cols-3">{similar.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
      <section className="mt-10"><h2 className="mb-4 text-xl font-bold">محصولات مکمل</h2><div className="grid gap-4 md:grid-cols-3">{complement.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
    </main>
  );
}
