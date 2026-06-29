import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type Crumb = { label: string; href?: string };

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  action?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({ eyebrow, title, description, breadcrumbs, action, className }: PageHeaderProps) => (
  <header className={cn('mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div>
      {breadcrumbs?.length ? (
        <nav aria-label="breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-surface-500">
          {breadcrumbs.map((crumb, idx) => (
            <span key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 ? <span className="text-surface-300">/</span> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="font-medium transition hover:text-brand-700">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-surface-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-black tracking-tight text-surface-900 sm:text-4xl">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-surface-600 sm:text-base">{description}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </header>
);
