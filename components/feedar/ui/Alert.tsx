import { cn } from '@/lib/utils/cn';

type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<AlertTone, string> = {
  info: 'border-brand-100 bg-brand-50 text-brand-900',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-red-200 bg-red-50 text-red-900'
};

export function FpAlert({
  title,
  children,
  tone = 'info',
  className
}: {
  title?: string;
  children: React.ReactNode;
  tone?: AlertTone;
  className?: string;
}) {
  return (
    <div role="status" className={cn('rounded-2xl border px-4 py-3 text-sm leading-6', tones[tone], className)}>
      {title ? <p className="font-bold">{title}</p> : null}
      <div className={title ? 'mt-1 text-[13px] opacity-90' : ''}>{children}</div>
    </div>
  );
}
