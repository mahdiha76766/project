import { cn } from '@/lib/utils/cn';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
};

const variants = {
  primary: 'bg-ink-900 text-paper-50 hover:bg-brand-700',
  secondary: 'bg-ink-800 text-paper-50 hover:bg-ink-700',
  accent: 'bg-gold-500 text-ink-900 hover:bg-gold-400',
  ghost: 'bg-transparent text-ink-800 hover:bg-paper-100',
  outline: 'border border-paper-200 bg-paper-50 text-ink-800 hover:border-gold-400'
};

const sizes = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
