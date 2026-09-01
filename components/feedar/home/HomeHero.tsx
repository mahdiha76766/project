import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { HomeContent } from '@/lib/admin/page-content-config';
import { FEEDAR_HERO_DEFAULT } from '@/lib/feedar/content';

export function FeedarHomeHero({ home }: { home: HomeContent }) {
  return (
    <section className="ph-hero relative min-h-[92vh] overflow-hidden text-paper-50">
      <div className="ph-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="ph-orb pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full border border-gold-400/20" />
      <div className="pointer-events-none absolute bottom-10 right-[18%] h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
      <Container className="relative grid min-h-[92vh] items-center gap-12 py-20 lg:grid-cols-12">
        <div className="ph-fade lg:col-span-7">
          <p className="ph-kicker">{home.heroKicker || FEEDAR_HERO_DEFAULT.kicker}</p>
          <h1 className="mt-6 max-w-3xl text-display font-black text-paper-50">
            {home.heroTitle || FEEDAR_HERO_DEFAULT.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-9 text-paper-200">
            {home.heroDescription || FEEDAR_HERO_DEFAULT.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/products" className="rounded-full bg-paper-50 px-6 py-3 text-sm font-bold text-ink-900 hover:bg-gold-200">
              {home.heroCtaPrimary || 'مشاهده کاتالوگ'}
            </Link>
            <Link href="/about" className="rounded-full border border-paper-50/25 px-6 py-3 text-sm font-semibold text-paper-50 hover:border-gold-400">
              {home.heroCtaSecondary || 'درباره فیدار فارمد'}
            </Link>
          </div>
        </div>
        <div className="relative lg:col-span-5">
          <div className="ph-ring relative mx-auto aspect-square w-[min(100%,28rem)] overflow-hidden rounded-full">
            <img src={home.heroImage || FEEDAR_HERO_DEFAULT.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 end-4 hidden h-28 w-28 overflow-hidden rounded-full border-[6px] border-paper-50 sm:block">
            <img src={FEEDAR_HERO_DEFAULT.decoImage} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -top-4 start-0 rounded-full border border-gold-400/40 bg-ink-900/70 px-4 py-2 text-[11px] tracking-[0.2em] text-gold-200 backdrop-blur">
            R&D LAB
          </div>
        </div>
      </Container>
    </section>
  );
}
