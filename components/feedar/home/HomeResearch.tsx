import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpCircleImage } from '@/components/feedar/ui/CircleImage';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { FEEDAR_RESEARCH } from '@/lib/feedar/content';

export function FeedarHomeResearch({
  title,
  description,
  image
}: {
  title?: string;
  description?: string;
  image?: string;
}) {
  return (
    <section className="ph-section relative overflow-hidden bg-paper-100">
      <Container className="relative grid items-center gap-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <FpSectionHeader title={title || FEEDAR_RESEARCH.title} description={description || FEEDAR_RESEARCH.description} />
          <div className="mt-10 grid grid-cols-3 gap-3">
            {FEEDAR_RESEARCH.stats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-paper-200 bg-paper-50 p-5 text-center">
                <p className="text-2xl font-black text-ink-900">{item.value}</p>
                <p className="mt-1 text-[11px] text-surface-500">{item.label}</p>
              </div>
            ))}
          </div>
          <Link href="/research" className="ph-btn-primary mt-8 inline-flex">
            بیشتر درباره R&D
          </Link>
        </div>
        <div className="lg:col-span-6">
          <FpCircleImage
            src={image || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80'}
            alt="تحقیق و توسعه"
            size="xl"
          />
        </div>
      </Container>
    </section>
  );
}
