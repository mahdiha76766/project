import Link from 'next/link';
import { Container } from '@/components/ui/Container';

type Crumb = { label: string; href?: string };

export function StorePageHeader({
  label,
  title,
  description,
  breadcrumbs
}: {
  label?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <div className="border-b border-surface-200 bg-surface-0">
      <Container className="py-10 lg:py-12">
        {breadcrumbs?.length ? (
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-surface-400">
            {breadcrumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 ? <span>/</span> : null}
                {c.href ? (
                  <Link href={c.href} className="hover:text-brand-600">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-surface-600">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        {label ? <p className="site-label mb-2">{label}</p> : null}
        <h1 className="site-heading">{title}</h1>
        {description ? <p className="site-subtext mt-3 max-w-2xl">{description}</p> : null}
      </Container>
    </div>
  );
}

export function StoreSidebar({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-2xl border border-surface-200 bg-surface-0 p-5 lg:sticky lg:top-24">
      <h3 className="mb-4 text-sm font-bold text-surface-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </aside>
  );
}

export function StoreEmpty({ message }: { message: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-surface-300 bg-surface-0 py-16 text-center">
      <p className="text-sm text-surface-500">{message}</p>
    </div>
  );
}
