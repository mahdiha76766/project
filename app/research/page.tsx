import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpCircleImage } from '@/components/feedar/ui/CircleImage';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { FEEDAR_RESEARCH } from '@/lib/feedar/content';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({
    title: 'تحقیق و توسعه',
    description: `واحد تحقیق و توسعه ${FEEDAR_BRAND.nameFa} روی فرمولاسیون، پایداری و مستندسازی علمی محصولات کار می‌کند.`,
    canonicalPath: '/research'
  });
}

const tracks = [
  { title: 'انتخاب ماده اولیه', text: 'ارزیابی منبع، خلوص و انطباق با مشخصات کیفی پیش از ورود به خط تولید.' },
  { title: 'فرمولاسیون', text: 'طراحی ترکیب با تمرکز بر پایداری، ایمنی و قابلیت تولید صنعتی.' },
  { title: 'مستندسازی', text: 'ثبت داده‌ها، پرونده محصول و آماده‌سازی اطلاعات برای همکاران علمی.' }
];

export default function ResearchPage() {
  return (
    <>
      <FpPageHero
        kicker="R&D"
        title="تحقیق و توسعه"
        description={FEEDAR_RESEARCH.description}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'تحقیق و توسعه' }]}
      />
      <Container className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-16">
        <div className="grid gap-5">
          {tracks.map((item) => (
            <article key={item.title} className="fp-card p-6">
              <h2 className="text-lg font-bold text-surface-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-surface-500">{item.text}</p>
            </article>
          ))}
        </div>
        <div>
          <FpCircleImage
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80"
            alt="تحقیق و توسعه"
            size="xl"
          />
          <div className="mt-8 grid grid-cols-3 gap-3">
            {FEEDAR_RESEARCH.stats.map((item) => (
              <div key={item.label} className="fp-card p-4 text-center">
                <p className="text-lg font-bold text-brand-800">{item.value}</p>
                <p className="mt-1 text-[11px] text-surface-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
