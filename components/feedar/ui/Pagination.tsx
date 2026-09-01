import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function FpPagination({
  page,
  pageCount,
  hrefForPage,
  className
}: {
  page: number;
  pageCount: number;
  hrefForPage: (next: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {pages.map((item) => (
        <Link
          key={item}
          href={hrefForPage(item)}
          aria-current={item === page ? 'page' : undefined}
          className={cn(
            'flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            item === page
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-surface-200 bg-white text-surface-700 hover:border-brand-200 hover:bg-brand-50'
          )}
        >
          {item.toLocaleString('fa-IR')}
        </Link>
      ))}
    </nav>
  );
}
