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
        label="از دل طبیعت"
        title="دسته‌بندی‌های محبوب"
        description="هر آنچه برای عطر، طعم و حال خوب خانه نیاز دارید."
        href="/categories"
        linkText="همه دسته‌بندی‌ها"
      />
      <div className="grid auto-rows-[13rem] gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[12.5rem]">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className={`group relative isolate overflow-hidden rounded-[1.75rem] bg-brand-900 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-card-hover ${index === 0 ? 'sm:col-span-2 lg:row-span-2' : ''}`}
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
              <div className="min-w-0">
                <span className="mb-2 block text-[10px] font-black tracking-widest text-accent-300">مجموعه {String(index + 1).padStart(2, '0')}</span>
                <h3 className={`${index === 0 ? 'text-2xl sm:text-3xl' : 'text-lg'} font-black text-white`}>{cat.name}</h3>
              {cat.description ? (
                  <p className={`mt-1.5 line-clamp-2 max-w-sm text-xs leading-5 text-white/65 ${index === 0 ? 'hidden sm:block' : 'hidden'}`}>{cat.description}</p>
              ) : null}
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition group-hover:bg-accent-500">
                <RtlForwardArrow className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
