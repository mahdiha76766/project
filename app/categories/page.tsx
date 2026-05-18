import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export const metadata = buildMetadata('دسته‌بندی محصولات', 'مشاهده دسته‌بندی‌های اصلی فروشگاه');

export default async function CategoriesPage() {
  await connectToDatabase();
  const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 }).lean();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-r from-[#f7efdf] to-[#efe2ca] p-7 shadow-sm">
        <h1 className="text-3xl font-black text-[#4d382b]">دسته‌بندی محصولات</h1>
        <p className="mt-2 text-sm text-[#6c5847]">دسته مناسب خودت رو انتخاب کن و مستقیم برو به محصولات واقعی همون دسته.</p>
      </section>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat: any) => (
          <Link key={String(cat._id)} href={`/products?category=${cat.slug}`} className="group overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <img src={cat.image || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={cat.name} className="h-48 w-full object-cover" />
            <div className="p-5">
              <h2 className="text-xl font-black text-[#5a3e2b]">{cat.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-[#6e5847]">{cat.description || 'مشاهده محصولات این دسته‌بندی'}</p>
              <span className="mt-4 inline-block rounded-xl bg-[#f7f1e4] px-3 py-2 text-sm font-bold text-[#667744]">مشاهده محصولات</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
