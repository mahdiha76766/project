import Link from 'next/link';
import { Section } from './Section';
import { RtlForwardArrow } from './RtlForwardArrow';
import type { HomeBanner } from '@/lib/shop/home-types';

export function HomePromo({ banners }: { banners: HomeBanner[] }) {
  if (!banners.length) return null;

  return (
    <Section bg="white" className="!py-12 lg:!py-16">
      <div className="grid gap-4 md:grid-cols-2">
        {banners.slice(0, 2).map((b) => (
          <Link
            key={b.id}
            href={b.link || '/products'}
            className="group relative flex min-h-[200px] items-end overflow-hidden rounded-2xl bg-brand-800 p-6 sm:min-h-[240px] sm:p-8"
          >
            <img
              src={b.image}
              alt={b.title}
              className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-105"
            />
            <div className="relative">
              <p className="text-xs font-semibold text-brand-100">پیشنهاد ویژه</p>
              <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">{b.title}</h3>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                مشاهده
                <RtlForwardArrow />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
