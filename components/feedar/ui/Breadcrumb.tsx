import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type FpCrumb = { label: string; href?: string };

export function FpBreadcrumb({ items, className }: { items: FpCrumb[]; className?: string }) {
  return (
    <nav aria-label="مسیر صفحه" className={cn('flex flex-wrap items-center gap-1 text-sm text-surface-500', className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {item.href && !last ? (
              <Link href={item.href} className="rounded-md px-1 py-0.5 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'font-semibold text-surface-800' : ''} aria-current={last ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!last ? <ChevronLeft className="h-3.5 w-3.5 text-surface-300" aria-hidden /> : null}
          </span>
        );
      })}
    </nav>
  );
}
