import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export function FpLogo({
  inverted = false,
  compact = false,
  name
}: {
  inverted?: boolean;
  compact?: boolean;
  name?: string;
}) {
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label={FEEDAR_BRAND.nameFa}>
      <span
        className={cn(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black',
          inverted ? 'bg-paper-50 text-ink-900' : 'bg-ink-900 text-paper-50'
        )}
      >
        <span className="absolute inset-[-4px] rounded-full border border-gold-400/70" />
        ف
      </span>
      {compact ? null : (
        <span className="min-w-0 leading-tight">
          <span className={cn('block truncate text-base font-black tracking-tight', inverted ? 'text-paper-50' : 'text-ink-900')}>
            {name || FEEDAR_BRAND.nameFa}
          </span>
          <span className={cn('hidden text-[10px] uppercase tracking-[0.22em] sm:block', inverted ? 'text-gold-200' : 'text-gold-500')}>
            {FEEDAR_BRAND.nameEn}
          </span>
        </span>
      )}
    </Link>
  );
}
