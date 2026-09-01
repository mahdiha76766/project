import { Container } from '@/components/ui/Container';
import { FpBreadcrumb, type FpCrumb } from '@/components/feedar/ui/Breadcrumb';
import { cn } from '@/lib/utils/cn';

export function FpPageHero({
  kicker,
  title,
  description,
  breadcrumbs,
  className
}: {
  kicker?: string;
  title: string;
  description?: string;
  breadcrumbs?: FpCrumb[];
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden bg-ink-900 text-paper-50', className)}>
      <div className="ph-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full border border-gold-400/20" />
      <Container className="relative py-14 sm:py-16 lg:py-20">
        {breadcrumbs?.length ? (
          <div className="mb-6 [&_a]:text-gold-200 [&_span]:text-paper-200">
            <FpBreadcrumb items={breadcrumbs} />
          </div>
        ) : null}
        {kicker ? <p className="ph-kicker">{kicker}</p> : null}
        <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
        {description ? <p className="mt-5 max-w-2xl text-base leading-8 text-paper-200">{description}</p> : null}
      </Container>
    </section>
  );
}
