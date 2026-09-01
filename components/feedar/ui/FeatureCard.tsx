import { cn } from '@/lib/utils/cn';

export function FpFeatureCard({
  title,
  description,
  index,
  className
}: {
  title: string;
  description: string;
  index?: number;
  className?: string;
}) {
  return (
    <article className={cn('rounded-[1.5rem] border border-paper-200 bg-paper-50 p-6', className)}>
      <p className="font-mono text-xs tracking-[0.2em] text-gold-500">
        {String((index ?? 0) + 1).padStart(2, '0')}
      </p>
      <h3 className="mt-3 text-lg font-black text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-surface-500">{description}</p>
    </article>
  );
}
