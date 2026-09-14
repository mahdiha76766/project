import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageItems(current: number, total: number) {
  const values = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  return Array.from(values).filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
}

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'page') query.set(key, value);
  });
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `/products?${search}` : '/products';
}

export function StorePagination({ currentPage, totalPages, params }: { currentPage: number; totalPages: number; params: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const pages = pageItems(currentPage, totalPages);

  return (
    <nav className="mt-9 flex flex-wrap items-center justify-center gap-2" aria-label="صفحه‌بندی محصولات">
      {currentPage > 1 ? (
        <Link href={pageHref(params, currentPage - 1)} aria-label="صفحه قبلی" className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:border-brand-300 hover:text-brand-700"><ChevronRight className="h-4 w-4" /></Link>
      ) : null}
      {pages.map((page, index) => (
        <span key={page} className="contents">
          {index > 0 && page - pages[index - 1] > 1 ? <span className="px-1 text-surface-400">…</span> : null}
          <Link href={pageHref(params, page)} aria-current={page === currentPage ? 'page' : undefined} className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-black transition ${page === currentPage ? 'bg-brand-800 text-white shadow-md' : 'border border-surface-200 bg-white text-surface-600 hover:border-brand-300'}`}>{page.toLocaleString('fa-IR')}</Link>
        </span>
      ))}
      {currentPage < totalPages ? (
        <Link href={pageHref(params, currentPage + 1)} aria-label="صفحه بعدی" className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 hover:border-brand-300 hover:text-brand-700"><ChevronLeft className="h-4 w-4" /></Link>
      ) : null}
    </nav>
  );
}
