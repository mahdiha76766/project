import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpCategoryCard } from '@/components/feedar/ui/CategoryCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolveImage } from '@/lib/shop/resolve-image';
import { Category } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export const metadata = buildMetadata(
  'دسته‌بندی‌ها',
  'دسته‌بندی محصولات فیدار فارمد',
  { canonical: '/categories' }
);

export default async function CategoriesPage() {
  const categories = await withDatabase(
    () => Category.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
    []
  );

  return (
    <>
      <FpPageHero
        kicker="کاتالوگ"
        title="دسته‌بندی‌ها"
        description="خط دارویی مورد نظر را انتخاب کنید."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'دسته‌بندی‌ها' }]}
      />
      <Container className="py-12 lg:py-16">
        {categories.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat: any) => (
              <FpCategoryCard
                key={String(cat._id)}
                href={`/categories/${cat.slug}`}
                title={cat.name}
                description={cat.description || 'مشاهده محصولات این دسته'}
                image={resolveImage(cat.image)}
              />
            ))}
          </div>
        ) : (
          <FpEmptyState title="دسته‌ای ثبت نشده" description="دسته‌بندی‌ها از پنل مدیریت اضافه می‌شوند." actionHref="/products" actionLabel="محصولات" />
        )}
      </Container>
    </>
  );
}
