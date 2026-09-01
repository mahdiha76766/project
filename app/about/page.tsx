import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpCircleImage } from '@/components/feedar/ui/CircleImage';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';
import { FEEDAR_ABOUT, FEEDAR_HERO_DEFAULT } from '@/lib/feedar/content';
import { parsePipeLines } from '@/lib/feedar/pipe-text';
import { getSitePageContent } from '@/lib/admin/page-content';

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSitePageContent();
  return buildPublicMetadata({
    title: content.about.seoTitle || 'درباره ما',
    description: content.about.seoDescription || `معرفی ${FEEDAR_BRAND.nameFa}؛ شرکت دارویی با تمرکز بر محصولات دارویی، گیاهی و مکمل.`,
    canonicalPath: '/about',
    image: content.about.image
  });
}

export default async function AboutPage() {
  const content = await getSitePageContent();
  const about = content.about;
  const values = parsePipeLines(about.valuesText);
  const stats = parsePipeLines(about.statsText);

  return (
    <>
      <FpPageHero
        kicker={FEEDAR_BRAND.nameEn}
        title={`درباره ${FEEDAR_BRAND.nameFa}`}
        description={FEEDAR_BRAND.description}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'درباره ما' }]}
      />
      <Container className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-16">
        <div className="space-y-5 text-sm leading-8 text-surface-600 sm:text-base">
          <p>{about.introduction || FEEDAR_BRAND.description}</p>
          <p>{about.history || FEEDAR_ABOUT.history}</p>
        </div>
        <FpCircleImage src={about.image || content.home.aboutImage || FEEDAR_HERO_DEFAULT.image} alt={FEEDAR_BRAND.nameFa} />
      </Container>
      <Container className="grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {(stats.length ? stats : FEEDAR_ABOUT.stats.map((item) => ({ title: item.value, text: item.label }))).map((item) => (
          <article key={item.title} className="fp-card p-5 text-center">
            <p className="text-2xl font-bold text-brand-800">{item.title}</p>
            <p className="mt-2 text-sm text-surface-500">{item.text}</p>
          </article>
        ))}
      </Container>
      <section className="bg-surface-50 py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="fp-card p-6">
              <h2 className="text-xl font-bold">ماموریت</h2>
              <p className="mt-3 text-sm leading-8 text-surface-500">{about.mission}</p>
            </article>
            <article className="fp-card p-6">
              <h2 className="text-xl font-bold">چشم‌انداز</h2>
              <p className="mt-3 text-sm leading-8 text-surface-500">{about.vision}</p>
            </article>
          </div>
          <FpSectionHeader className="mt-12" title="ارزش‌ها" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(values.length ? values : FEEDAR_ABOUT.values.map((item) => ({ title: item.title, text: item.text }))).map((item) => (
              <article key={item.title} className="fp-card p-5">
                <h3 className="font-bold text-surface-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-surface-500">{item.text}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
