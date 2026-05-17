import { notFound } from 'next/navigation';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { ProductReviewsSection } from '@/components/shop/ProductReviewsSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) return { title: 'محصول یافت نشد', description: 'محصول موردنظر موجود نیست' };
  return {
    title: `${product.name} | خرید آنلاین`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { images: [{ url: product.images?.[0] || '' }] }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) notFound();

  const similar = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true }).limit(3).lean();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <img src={product.images?.[0] || 'https://via.placeholder.com/800x600'} alt={product.name} className="h-80 w-full rounded-2xl object-cover" />
        <div>
          <h1 className="text-2xl font-black text-amber-900">{product.name}</h1>
          <p className="mt-2 text-slate-600">{product.shortDescription}</p>
          <p className="mt-4 text-xl font-bold">{(product.discountPrice ?? product.price).toLocaleString('fa-IR')} تومان</p>
          <p className="mt-2 text-sm">موجودی: {product.stock > 0 ? 'موجود' : 'ناموجود'}</p>
        </div>
      </div>

      <ProductReviewsSection slug={product.slug} />

      <section className="mt-10"><h2 className="mb-4 text-xl font-bold">محصولات مشابه</h2><div className="grid gap-4 md:grid-cols-3">{similar.map((p:any) => <a key={String(p._id)} href={`/products/${p.slug}`} className="rounded-xl border bg-white p-4"><p className="font-bold">{p.name}</p><p className="text-sm">{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</p></a>)}</div></section>
    </main>
  );
}
