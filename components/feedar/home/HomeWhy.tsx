import { Container } from '@/components/ui/Container';
import { FpCircleImage } from '@/components/feedar/ui/CircleImage';
import { FpFeatureCard } from '@/components/feedar/ui/FeatureCard';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { FEEDAR_WHY } from '@/lib/feedar/content';

export function FeedarHomeWhy({
  title,
  description,
  image
}: {
  title: string;
  description: string;
  image: string;
}) {
  return (
    <section className="ph-section bg-ink-900 text-paper-50">
      <Container className="grid items-center gap-16 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <FpCircleImage
            src={image || 'https://images.unsplash.com/photo-1584306670957-2f78871011c2?auto=format&fit=crop&w=900&q=80'}
            alt={title}
            size="xl"
          />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-7">
          <FpSectionHeader light title={title} description={description} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEEDAR_WHY.map((item, index) => (
              <FpFeatureCard
                key={item.title}
                index={index}
                title={item.title}
                description={item.description}
                className="border-white/10 bg-white/5 text-paper-50 [&_h3]:text-paper-50 [&_p]:text-paper-200"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
