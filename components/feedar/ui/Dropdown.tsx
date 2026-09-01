'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

type Item = { href: string; label: string };

export function FpDropdown({
  label,
  href,
  items,
  active
}: {
  label: string;
  href: string;
  items: readonly Item[];
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        <Link
          href={href}
          className={cn(
            'rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            active ? 'bg-brand-50 text-brand-800' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
          )}
        >
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`زیرمنوی ${label}`}
          className={cn(
            'flex h-9 w-8 items-center justify-center rounded-xl text-surface-500 transition hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            open && 'bg-surface-100 text-brand-700'
          )}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
        </button>
      </div>
      {open ? (
        <div
          id={id}
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-52 overflow-hidden rounded-2xl border border-surface-200 bg-white py-2 shadow-card"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-surface-700 transition hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:bg-brand-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
