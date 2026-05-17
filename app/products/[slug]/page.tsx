import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/shop/ProductCard';
import { products } from '@/lib/data/shop-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: 'محصول یافت نشد', description: 'محصول موردنظر موجود نیست' };
  return {
    title: `${product.name} | خرید آنلاین`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { images: [{ url: product.images[0] }] }
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const similar = products.filter((p) => p.category === product.category && p.id !== product.id);
  const complement = products.filter((p) => p.id !== product.id).slice(0, 2);

  const productSchema = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: product.images,
    description: product.shortDescription, sku: product.slug,
    offers: { '@type': 'Offer', priceCurrency: 'IRR', price: product.discountPrice ?? product.price, availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'محصولات', item: '/products' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `/products/${product.slug}` }
    ]
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="grid gap-6 md:grid-cols-2">
        <img src={product.images[0]} alt={product.name} className="h-80 w-full rounded-2xl object-cover" />
        <div>
          <h1 className="text-2xl font-black text-amber-900">{product.name}</h1>
          <p className="mt-2 text-slate-600">{product.shortDescription}</p>
          <p className="mt-4 text-xl font-bold">{(product.discountPrice ?? product.price).toLocaleString('fa-IR')} تومان</p>
          <p className="mt-2 text-sm">موجودی: {product.stock > 0 ? 'موجود' : 'ناموجود'}</p>
        </div>
      </div>
      <section className="mt-10"><h2 className="mb-4 text-xl font-bold">محصولات مشابه</h2><div className="grid gap-4 md:grid-cols-3">{similar.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
      <section className="mt-10"><h2 className="mb-4 text-xl font-bold">محصولات مکمل</h2><div className="grid gap-4 md:grid-cols-3">{complement.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
      <section className="mt-10 space-y-2"><h2 className="text-xl font-bold">سوالات متداول</h2><details className="rounded-xl bg-white p-4"><summary>این محصول چگونه نگهداری شود؟</summary><p className="mt-2">دور از نور مستقیم و در محیط خنک.</p></details></section>
    </main>
  );
}
