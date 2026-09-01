'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function FpSearchInput({
  action = '/search',
  placeholder = 'جستجو در محصولات و مقالات',
  defaultValue = '',
  compact = false,
  className,
  bare = false,
  name = 'q'
}: {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
  compact?: boolean;
  className?: string;
  bare?: boolean;
  name?: string;
}) {
  const field = (
    <div className={cn('relative', className)}>
      <label htmlFor={`search-${name}`} className="sr-only">
        جستجو
      </label>
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
      <input
        id={`search-${name}`}
        name={name}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={cn('fp-input pr-10', compact && 'h-10 rounded-full bg-surface-50')}
      />
    </div>
  );

  if (bare) return field;

  return (
    <form action={action} role="search">
      {field}
    </form>
  );
}
