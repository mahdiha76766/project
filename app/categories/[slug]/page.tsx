import { notFound } from 'next/navigation';
import { products, storeCategories } from '@/lib/data/shop-data';
import { ProductCard } from '@/components/shop/ProductCard';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = storeCategories.find((c) => c.slug === slug);
  if (!category) return { title: 'دسته‌بندی یافت نشد' };
  return {
    title: `${category.name} | فروشگاه عصاره طبیعت`,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` }
  };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = storeCategories.find((c) => c.slug === slug);
  if (!category) notFound();
  const items = products.filter((p) => p.category === slug);

  return <main className="mx-auto max-w-6xl p-6"><h1 className="text-2xl font-bold">{category.name}</h1><div className="mt-4 grid gap-4 md:grid-cols-3">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div></main>;
}
