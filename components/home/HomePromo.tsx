import Link from 'next/link';
import { Section } from './Section';
import { RtlForwardArrow } from './RtlForwardArrow';
import { Sparkles } from 'lucide-react';
import type { HomeBanner } from '@/lib/shop/home-types';

export function HomePromo({ banners }: { banners: HomeBanner[] }) {
  if (!banners.length) return null;

  return (
    <Section bg="white" className="!py-12 lg:!py-16">
      <div className="grid gap-4 lg:grid-cols-5">
        {banners.slice(0, 2).map((b, index) => (
          <Link
            key={b.id}
            href={b.link || '/products'}
            className={`group relative flex min-h-[17rem] items-end overflow-hidden rounded-[2rem] bg-brand-900 p-6 shadow-card sm:p-8 ${index === 0 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
          >
            <img
              src={b.image}
              alt={b.title}
              className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="relative flex w-full items-end justify-between gap-5">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-300"><Sparkles className="h-3.5 w-3.5" /> پیشنهاد ویژه این هفته</p>
                <h3 className="mt-2 text-xl font-black leading-snug text-white sm:text-2xl">{b.title}</h3>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition group-hover:bg-accent-500">
                <RtlForwardArrow className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}
