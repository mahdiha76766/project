import { cn } from '@/lib/utils/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  ltr?: boolean;
};

export const Input = ({ label, hint, error, ltr, className, id, ...props }: InputProps) => {
  const inputId = id || props.name;

  return (
    <div className="text-right">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-surface-700">
        {label}
      </label>
      <input
        id={inputId}
        dir={ltr ? 'ltr' : undefined}
        className={cn(
          'w-full rounded-xl border bg-surface-50 px-3.5 py-2.5 text-sm text-surface-900 outline-none transition placeholder:text-surface-400',
          ltr && 'text-right',
          error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-surface-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          className
        )}
        {...props}
      />
      {error ? <p className="mt-1.5 text-right text-xs font-medium text-red-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-right text-xs text-surface-500">{hint}</p> : null}
    </div>
  );
};
