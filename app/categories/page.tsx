import Link from 'next/link';
import { storeCategories } from '@/lib/data/shop-data';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata('دسته‌بندی محصولات', 'مشاهده دسته‌بندی‌های اصلی فروشگاه');

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-black text-amber-900">دسته‌بندی‌ها</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {storeCategories.map((cat) => (
          <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="rounded-2xl border bg-white p-5">
            <h2 className="font-bold">{cat.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{cat.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
