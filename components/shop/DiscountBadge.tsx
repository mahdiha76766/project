'use client';

import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useShowPrices } from '@/components/commerce/SalesProvider';

type DiscountBadgeProps = {
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'overlay' | 'pill' | 'ribbon';
};

const sizeClass = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-[11px]',
  lg: 'px-3 py-1.5 text-xs'
};

export function DiscountBadge({ label, className, size = 'md', variant = 'overlay' }: DiscountBadgeProps) {
  const show = useShowPrices();
  if (!show || !label) return null;

  if (variant === 'ribbon') {
    return (
      <span
        className={cn(
          'absolute left-0 top-4 z-10 inline-flex items-center gap-1 bg-gradient-to-l from-rose-600 to-red-500 py-1 pl-3 pr-4 font-black text-white shadow-lg shadow-rose-300/40',
          sizeClass[size],
          className
        )}
      >
        <Tag className="h-3 w-3 shrink-0 opacity-90" />
        {label}
        <span className="absolute -left-1 bottom-0 h-0 w-0 border-y-[6px] border-l-[6px] border-y-transparent border-l-red-700" />
      </span>
    );
  }

  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-rose-500 to-red-600 font-bold text-white shadow-sm',
          sizeClass[size],
          className
        )}
      >
        <Tag className="h-3 w-3 shrink-0" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 font-black text-white shadow-lg shadow-rose-200/60',
        sizeClass[size],
        className
      )}
    >
      <Tag className="h-3 w-3 shrink-0 opacity-90" />
      {label}
    </span>
  );
}

export function ProductPriceWithDiscount({
  salePrice,
  originalPrice,
  hasDiscount,
  hasVariants,
  className
}: {
  salePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  hasVariants?: boolean;
  className?: string;
}) {
  const show = useShowPrices();
  if (!show) return null;
  return (
    <div className={className}>
      <p className="text-base font-black text-brand-600">
        {hasVariants ? <span className="ml-1 text-xs font-normal text-surface-400">از</span> : null}
        {salePrice.toLocaleString('fa-IR')}{' '}
        <span className="text-xs font-normal text-surface-400">تومان</span>
      </p>
      {hasDiscount && originalPrice > salePrice ? (
        <p className="mt-0.5 text-xs text-surface-400 line-through">{originalPrice.toLocaleString('fa-IR')} تومان</p>
      ) : null}
    </div>
  );
}
