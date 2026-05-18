import { Filters } from '@/components/shop/Filters';
import { ProductCard } from '@/components/shop/ProductCard';
import { buildMetadata } from '@/lib/seo/metadata';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export const metadata = buildMetadata('محصولات فروشگاه', 'لیست محصولات روغن، ادویه و عصاری با فیلتر و جستجو');

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const category = String(params.category || '').trim();
  const sort = String(params.sort || 'newest');

  await connectToDatabase();

  const filter: Record<string, unknown> = { isActive: true };
  if (category) {
    const foundCategory = await Category.findOne({ slug: category, isActive: true }).select('_id').lean();
    filter.category = foundCategory?._id || null;
  }
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { shortDescription: { $regex: q, $options: 'i' } },
      { fullDescription: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } }
    ];
  }

  const sortObj =
    sort === 'cheapest'
      ? { discountPrice: 1, price: 1 }
      : sort === 'expensive'
        ? { discountPrice: -1, price: -1 }
        : sort === 'best_selling'
          ? { isFeatured: -1, createdAt: -1 }
          : { createdAt: -1 };

  const [items, categories] = await Promise.all([
    Product.find(filter).sort(sortObj).populate('category', 'slug').lean(),
    Category.find({ isActive: true }).sort({ name: 1 }).select('slug name').lean()
  ]);

  const products = items.map((p: any) => ({
    id: String(p._id),
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    fullDescription: p.fullDescription || '',
    category: p.category?.slug || '',
    tags: p.tags || [],
    attributes: p.attributes || {},
    images: p.images?.length ? p.images : ['https://via.placeholder.com/640x480'],
    price: Number(p.price || 0),
    discountPrice: typeof p.discountPrice === 'number' ? p.discountPrice : undefined,
    stock: Number(p.stock || 0),
    rating: 5,
    reviewCount: 0,
    type: 'normal' as const,
    temperament: 'warm' as const,
    bestSeller: Boolean(p.isFeatured)
  }));

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[280px_1fr]">
      <form><Filters categories={categories.map((c: any) => ({ slug: c.slug, name: c.name }))} /></form>
      <section>
        <h1 className="mb-4 text-2xl font-black text-amber-900">محصولات</h1>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>
    </main>
  );
}
