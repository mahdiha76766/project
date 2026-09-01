import { cn } from '@/lib/utils/cn';

export function FpPulseMark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-gold-500', className)} aria-hidden>
      <span className="h-px w-8 bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}

export function FpSectionHeader({
  title,
  description,
  className,
  light
}: {
  title: string;
  description?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <FpPulseMark className={light ? 'text-gold-200' : 'text-gold-500'} />
      <h2 className={cn('mt-3 text-2xl font-black tracking-tight sm:text-4xl', light ? 'text-paper-50' : 'text-ink-900')}>
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-4 text-sm leading-8 sm:text-base', light ? 'text-paper-200' : 'text-surface-500')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
