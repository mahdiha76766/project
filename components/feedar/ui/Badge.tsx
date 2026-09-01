import { cn } from '@/lib/utils/cn';

type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-100',
  neutral: 'bg-surface-100 text-surface-700 ring-surface-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-800 ring-amber-100'
};

export function FpBadge({
  children,
  tone = 'brand',
  className
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
