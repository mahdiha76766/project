'use client';

type AdminPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
};

export function AdminPagination({ page, totalPages, total, onChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-500">مجموع {total.toLocaleString('fa-IR')} مورد</p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-40"
        >
          قبلی
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showEllipsis = prev && p - prev > 1;
          return (
            <span key={p} className="inline-flex items-center gap-1">
              {showEllipsis ? <span className="px-1 text-slate-400">…</span> : null}
              <button
                type="button"
                onClick={() => onChange(p)}
                className={`h-9 min-w-9 rounded-lg border px-3 text-xs font-bold ${
                  p === page ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 text-slate-600'
                }`}
              >
                {p.toLocaleString('fa-IR')}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-40"
        >
          بعدی
        </button>
      </div>
    </div>
  );
}
