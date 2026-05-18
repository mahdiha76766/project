import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export const metadata = buildMetadata('دسته‌بندی محصولات', 'مشاهده دسته‌بندی‌های اصلی فروشگاه');

const resolveImage = (image?: string) => {
  if (!image) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5';
  const cleaned = image.replaceAll('\\', '/').replace(/^public\//, '').trim();
  if (!cleaned) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5';
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};

export default async function CategoriesPage() {
  await connectToDatabase();
  const categories = await Category.find({ isActive: true }).sort({ createdAt: -1 }).lean();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-[#4d382b]">دسته‌بندی‌ها</h1>
        <p className="mt-2 text-sm text-[#6c5847]">یک دسته را انتخاب کنید تا محصولات همان بخش را ببینید.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((cat: any) => (
          <Link key={String(cat._id)} href={`/products?category=${cat.slug}`} className="group relative overflow-hidden rounded-2xl border border-[#eadfcf] bg-[#fffaf1] p-1.5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="relative overflow-hidden rounded-xl">
              <img src={resolveImage(cat.image)} alt={cat.name} className="h-28 w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <h2 className="absolute bottom-2 right-2 left-2 line-clamp-1 text-sm font-black text-white drop-shadow">{cat.name}</h2>
            </div>
            {cat.description ? <p className="mt-2 line-clamp-1 px-1 text-xs text-[#6e5847]">{cat.description}</p> : null}
          </Link>
        ))}
      </section>
    </main>
  );
}
