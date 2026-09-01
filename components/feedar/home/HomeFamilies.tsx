import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpCategoryCard } from '@/components/feedar/ui/CategoryCard';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { PRODUCT_CATEGORY_CARDS } from '@/lib/feedar/content';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export function FeedarHomeFamilies({
  categories
}: {
  categories: Array<{ slug: string; name: string; description: string; image: string }>;
}) {
  const cards: Array<{ href: string; title: string; description: string; image: string }> = categories.length
    ? categories.slice(0, 4).map((c) => ({
        href: `/categories/${c.slug}`,
        title: c.name,
        description: c.description || 'مشاهده محصولات این دسته',
        image: c.image
      }))
    : [...PRODUCT_CATEGORY_CARDS];

  return (
    <section className="site-section bg-white">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FpSectionHeader title="دسته‌بندی محصولات" description={`خطوط دارویی، گیاهی و مکمل ${FEEDAR_BRAND.nameFa}.`} />
          <Link href="/categories" className="fp-btn-outline !py-2 text-sm">
            همه دسته‌ها
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <FpCategoryCard key={card.href} {...card} />
          ))}
        </div>
      </Container>
    </section>
  );
}
