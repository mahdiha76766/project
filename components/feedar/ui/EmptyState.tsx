import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function FpEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  className
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-dashed border-surface-200 bg-surface-0 px-6 py-14 text-center', className)}>
      <p className="text-base font-bold text-surface-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-surface-500">{description}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="fp-btn-primary mt-6 inline-flex">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
