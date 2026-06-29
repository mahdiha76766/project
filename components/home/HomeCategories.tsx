import Link from 'next/link';
import { Section } from './Section';
import { SectionHeading } from './SectionHeading';
import { RtlForwardArrow } from './RtlForwardArrow';
import type { HomeCategory } from '@/lib/shop/home-types';

export function HomeCategories({ categories }: { categories: HomeCategory[] }) {
  if (!categories.length) return null;

  return (
    <Section bg="white">
      <SectionHeading
        label="دسته‌بندی"
        title="کاوش در مجموعه ما"
        description="روغن، ادویه، گیاهان دارویی و بیشتر."
        href="/categories"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-surface-200 bg-surface-0 p-3 transition hover:border-brand-200 hover:shadow-card"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-surface-900 group-hover:text-brand-700">{cat.name}</h3>
              {cat.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-surface-500">{cat.description}</p>
              ) : null}
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                مشاهده
                <RtlForwardArrow className="h-3 w-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
