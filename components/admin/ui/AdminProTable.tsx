'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ImageIcon,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Eye
} from 'lucide-react';
import { formatCurrency, formatDate, formatNumber, formatText, resolveImageUrl } from '@/lib/admin/table-formats';
import { cn } from '@/lib/utils/cn';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary';

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'badge'
  | 'image'
  | 'images'
  | 'link'
  | 'ltr'
  | 'custom';

export type ProColumn<T> = {
  id: string;
  header: string;
  icon?: React.ReactNode;
  type?: ColumnType;
  accessor?: (row: T) => unknown;
  render?: (row: T, value: unknown) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  align?: 'right' | 'left' | 'center';
  width?: string;
  className?: string;
  badge?: (row: T, value: unknown) => { label: string; tone: BadgeTone };
  linkHref?: (row: T) => string;
  imageFallback?: string;
};

export type RowAction<T> = {
  id: string;
  label: string;
  icon?: 'edit' | 'delete' | 'view';
  tone?: 'default' | 'danger' | 'primary';
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
};

const badgeStyles: Record<BadgeTone, string> = {
  success: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  danger: 'bg-red-100 text-red-700 ring-red-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-sky-100 text-sky-700 ring-sky-200',
  primary: 'bg-violet-100 text-violet-700 ring-violet-200'
};

const actionIcons = {
  edit: Pencil,
  delete: Trash2,
  view: Eye
};

const actionToneStyles = {
  default: 'border-slate-200 text-slate-600 hover:bg-slate-50',
  primary: 'border-amber-200 text-amber-700 hover:bg-amber-50',
  danger: 'border-red-200 text-red-600 hover:bg-red-50'
};

function getCellValue<T>(row: T, column: ProColumn<T>) {
  return column.accessor ? column.accessor(row) : (row as any)[column.id];
}

function renderCell<T>(row: T, column: ProColumn<T>) {
  const value = getCellValue(row, column);
  if (column.render) return column.render(row, value);

  const type = column.type || 'text';
  switch (type) {
    case 'number':
      return formatNumber(value);
    case 'currency':
      return formatCurrency(value);
    case 'date':
      return formatDate(value);
    case 'ltr':
      return (
        <span dir="ltr" className="inline-block text-right font-mono text-xs text-slate-700">
          {formatText(value)}
        </span>
      );
    case 'badge': {
      const badge = column.badge?.(row, value) || { label: formatText(value), tone: 'neutral' as BadgeTone };
      return (
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', badgeStyles[badge.tone])}>
          {badge.label}
        </span>
      );
    }
    case 'image':
      return (
        <img
          src={resolveImageUrl(String(value || ''), column.imageFallback)}
          alt=""
          className="h-11 w-11 rounded-xl border border-slate-200 object-cover shadow-sm"
        />
      );
    case 'images': {
      const urls = Array.isArray(value) ? value : [];
      if (!urls.length) return <span className="text-xs text-slate-400">بدون تصویر</span>;
      return (
        <div className="flex -space-x-2 space-x-reverse">
          {urls.slice(0, 3).map((url, i) => (
            <img
              key={`${url}-${i}`}
              src={resolveImageUrl(String(url), column.imageFallback)}
              alt=""
              className="h-10 w-10 rounded-lg border-2 border-white object-cover shadow-sm"
            />
          ))}
          {urls.length > 3 ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-slate-100 text-xs font-bold text-slate-600">
              +{(urls.length - 3).toLocaleString('fa-IR')}
            </span>
          ) : null}
        </div>
      );
    }
    case 'link':
      return column.linkHref ? (
        <a href={column.linkHref(row)} className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">
          {formatText(value)}
        </a>
      ) : (
        formatText(value)
      );
    default:
      return <span className="font-medium text-slate-800">{formatText(value)}</span>;
  }
}

export function AdminProTable<T>({
  data,
  columns,
  rowKey,
  actions = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'جستجو در جدول...',
  emptyMessage = 'موردی یافت نشد.',
  striped = true,
  query: controlledQuery,
  onQueryChange,
  serverSearch = false,
  totalCount
}: {
  data: T[];
  columns: ProColumn<T>[];
  rowKey: (row: T) => string;
  actions?: RowAction<T>[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  striped?: boolean;
  /** Controlled search (from useAdminList). Resets server pagination to page 1. */
  query?: string;
  onQueryChange?: (value: string) => void;
  /** When true, data is already filtered/paginated by the server — skip client filter. */
  serverSearch?: boolean;
  totalCount?: number;
}) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = controlledQuery ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let rows = [...data];
    const q = query.trim().toLowerCase();
    if (q && !serverSearch) {
      rows = rows.filter((row) =>
        columns.some((col) => {
          if (col.searchable === false) return false;
          const val = getCellValue(row, col);
          return String(val ?? '').toLowerCase().includes(q);
        })
      );
    }
    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col) {
        rows.sort((a, b) => {
          const av = getCellValue(a, col);
          const bv = getCellValue(b, col);
          const aNum = Number(av);
          const bNum = Number(bv);
          let cmp = 0;
          if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) cmp = aNum - bNum;
          else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'fa');
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return rows;
  }, [data, columns, query, sort]);

  const toggleSort = (col: ProColumn<T>) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (!prev || prev.id !== col.id) return { id: col.id, dir: 'asc' };
      if (prev.dir === 'asc') return { id: col.id, dir: 'desc' };
      return null;
    });
  };

  const allColumns = actions.length ? [...columns, { id: '__actions', header: 'عملیات', type: 'custom' as const, sortable: false, searchable: false }] : columns;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {searchable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="relative min-w-[220px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {serverSearch && totalCount != null
              ? `${totalCount.toLocaleString('fa-IR')} مورد${query.trim() ? ' (فیلتر شده)' : ''}`
              : `${filtered.length.toLocaleString('fa-IR')} از ${data.length.toLocaleString('fa-IR')} مورد`}
          </p>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-gradient-to-l from-slate-50 to-white">
              {allColumns.map((col) => {
                const isAction = col.id === '__actions';
                const activeSort = sort?.id === col.id;
                return (
                  <th
                    key={col.id}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500',
                      col.align === 'center' && 'text-center',
                      col.align === 'left' && 'text-left',
                      col.sortable && 'cursor-pointer select-none hover:text-slate-800'
                    )}
                    onClick={() => !isAction && toggleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.icon}
                      {col.header}
                      {col.sortable ? (
                        activeSort ? (
                          sort?.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                        )
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-slate-100">
                  {allColumns.map((col) => (
                    <td key={col.id} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length ? (
              filtered.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-slate-100 transition hover:bg-amber-50/40',
                    striped && idx % 2 === 1 && 'bg-slate-50/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'px-4 py-3 text-slate-700',
                        col.align === 'center' && 'text-center',
                        col.align === 'left' && 'text-left',
                        col.className
                      )}
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                  {actions.length ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {actions.map((action) => {
                          if (action.hidden?.(row)) return null;
                          const Icon = action.icon ? actionIcons[action.icon] : Pencil;
                          return (
                            <button
                              key={action.id}
                              type="button"
                              title={action.label}
                              aria-label={action.label}
                              onClick={() => action.onClick(row)}
                              className={cn(
                                'inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white transition',
                                actionToneStyles[action.tone || 'default']
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={allColumns.length} className="px-4 py-16 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-3 text-slate-500">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </span>
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-3 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال بارگذاری...
        </div>
      ) : null}
    </div>
  );
}
