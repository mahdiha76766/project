import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { ProductReviewsSection } from '@/components/shop/ProductReviewsSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product: any = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) return { title: 'محصول یافت نشد', description: 'محصول موردنظر موجود نیست' };
  return {
    title: product.seo?.title || `${product.name} | خرید آنلاین`,
    description: product.seo?.description || product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { images: [{ url: product.images?.[0] || '' }] }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product: any = await Product.findOne({ slug, isActive: true }).lean();
  if (!product) notFound();

  const sideProducts = await Product.find({ isActive: true, slug: { $ne: product.slug } }).sort({ isFeatured: -1, createdAt: -1 }).limit(8).lean();
  const relatedProducts = await Product.find({ isActive: true, _id: { $ne: product._id }, $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }] }).limit(4).lean();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="order-2 lg:order-1">
          <div className="top-6 rounded-3xl border border-[#e6dcc8] bg-white p-4 shadow-sm lg:sticky">
            <h3 className="mb-3 text-lg font-black text-[#4d382b]">سایر محصولات</h3>
            <div className="space-y-3">
              {sideProducts.map((p: any) => (
                <Link key={String(p._id)} href={`/products/${p.slug}`} className="group flex gap-3 rounded-2xl border border-[#efe4d0] p-2 transition hover:bg-[#faf5ea]">
                  <img src={p.images?.[0] || 'https://via.placeholder.com/200x200'} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div><p className="line-clamp-2 text-sm font-bold text-[#5a3e2b]">{p.name}</p><p className="text-xs text-[#7b6757]">{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</p></div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="order-1 lg:order-2">
          <article className="overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm">
            <img src={product.images?.[0] || 'https://via.placeholder.com/1200x700'} alt={product.name} className="h-72 w-full object-cover" />
            <div className="p-6">
              <h1 className="text-3xl font-black text-[#4d382b]">{product.name}</h1>
              <p className="mt-3 text-sm leading-7 text-[#5f4a3c]">{product.shortDescription}</p>
              <div className="mt-4 flex items-center gap-2 text-sm"><span className="text-2xl font-black text-[#667744]">{(product.discountPrice ?? product.price).toLocaleString('fa-IR')} تومان</span>{product.discountPrice ? <span className="text-[#9b8b79] line-through">{product.price.toLocaleString('fa-IR')}</span> : null}</div>
              <div className="mt-2 text-xs font-semibold text-[#7b5e3b]">وضعیت: {product.stock > 0 ? 'موجود' : 'ناموجود'}</div>
              {product.fullDescription ? <article className="mt-6 whitespace-pre-wrap leading-8 text-[#5f4a3c]">{product.fullDescription}</article> : null}
            </div>
          </article>

          {relatedProducts.length ? <section className='mt-8 rounded-3xl border border-[#e6dcc8] bg-white p-5'><h3 className='text-lg font-black text-[#4d382b]'>محصولات مرتبط</h3><div className='mt-4 grid gap-3 md:grid-cols-3'>{relatedProducts.map((p:any)=><Link key={String(p._id)} href={`/products/${p.slug}`} className='rounded-xl border border-[#eee2cf] p-3'><img src={p.images?.[0] || 'https://via.placeholder.com/300x220'} alt={p.name} className='h-28 w-full rounded-lg object-cover'/><p className='mt-2 text-sm font-bold text-[#5a3e2b]'>{p.name}</p><p className='text-xs text-[#6f5a4a]'>{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</p></Link>)}</div></section> : null}

          <ProductReviewsSection slug={product.slug} />
        </div>
      </div>
    </main>
  );
}
