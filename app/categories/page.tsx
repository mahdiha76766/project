import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { StorePageHeader } from '@/components/shop/store/StorePageHeader';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolveImage } from '@/lib/shop/resolve-image';
import { Category } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export const metadata = buildMetadata('دسته‌بندی‌ها', 'دسته‌بندی محصولات عطاری');

export default async function CategoriesPage() {
  const categories = await withDatabase(
    () => Category.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    []
  );

  return (
    <>
      <StorePageHeader
        label="فروشگاه"
        title="دسته‌بندی‌ها"
        description="دسته مورد نظر را انتخاب کنید."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'دسته‌بندی‌ها' }]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Link
              key={String(cat._id)}
              href={`/products?category=${cat.slug}`}
              className="group overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 transition hover:shadow-card"
            >
              <img src={resolveImage(cat.image)} alt={cat.name} className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" />
              <div className="p-4">
                <h2 className="font-bold text-surface-900 group-hover:text-brand-700">{cat.name}</h2>
                {cat.description ? <p className="mt-1 line-clamp-2 text-xs text-surface-500">{cat.description}</p> : null}
                <span className="site-link mt-3 text-xs group inline-flex">
                  محصولات<RtlForwardArrow className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
