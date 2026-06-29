import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Container } from '@/components/ui/Container';

type Crumb = { label: string; href?: string };

export function ProductPageHero({
  title,
  breadcrumbs,
  badge
}: {
  title: string;
  breadcrumbs?: Crumb[];
  badge?: string;
}) {
  const parent = breadcrumbs && breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <section className="border-b border-surface-200 bg-surface-0">
      <Container className="py-3 lg:py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {breadcrumbs?.length ? (
            <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-surface-400" aria-label="مسیر">
              {parent?.href ? (
                <Link
                  href={parent.href}
                  className="inline-flex shrink-0 items-center gap-0.5 font-medium text-surface-500 transition hover:text-brand-600"
                >
                  <ChevronLeft className="h-3 w-3" />
                  {parent.label}
                </Link>
              ) : null}
              {breadcrumbs.length > 1 ? <span className="text-surface-300">/</span> : null}
              <span className="truncate font-semibold text-surface-600">{title}</span>
            </nav>
          ) : (
            <span className="text-[11px] font-medium text-surface-400">جزئیات محصول</span>
          )}
          {badge ? (
            <span className="shrink-0 rounded-md bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-700">
              {badge}
            </span>
          ) : null}
        </div>
        <h1 className="mt-1 truncate text-base font-bold text-surface-900 lg:text-lg">{title}</h1>
      </Container>
    </section>
  );
}
