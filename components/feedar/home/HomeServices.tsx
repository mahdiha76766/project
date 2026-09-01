import { Container } from '@/components/ui/Container';
import { FpCircleImage } from '@/components/feedar/ui/CircleImage';
import { FpFeatureCard } from '@/components/feedar/ui/FeatureCard';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import type { HomeContent } from '@/lib/admin/page-content-config';
import { FEEDAR_SERVICES } from '@/lib/feedar/content';

export function FeedarHomeServices({ home }: { home: HomeContent }) {
  return (
    <section className="ph-section bg-paper-50">
      <Container className="grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FpSectionHeader title={home.aboutTitle} />
          <div className="mt-6 max-w-xl text-base leading-9 text-surface-500" dangerouslySetInnerHTML={{ __html: home.aboutHtml }} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEEDAR_SERVICES.map((item, index) => (
              <FpFeatureCard key={item.title} index={index} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <FpCircleImage src={home.aboutImage} alt={home.aboutTitle} size="xl" />
        </div>
      </Container>
    </section>
  );
}
