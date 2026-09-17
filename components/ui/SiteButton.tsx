import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const variants = {
  primary:
    'border border-transparent bg-brand-800 text-white shadow-lg shadow-brand-900/10 hover:bg-accent-500 hover:shadow-xl',
  outline:
    'border border-surface-200 bg-white text-brand-800 hover:border-brand-300 hover:bg-brand-800 hover:text-white',
  ghost: 'border border-transparent bg-transparent text-brand-800 hover:bg-brand-50',
  accent: 'border border-transparent bg-accent-500 text-white shadow-xl shadow-black/10 hover:bg-accent-400',
  soft: 'border border-white/15 bg-white/[0.06] text-white backdrop-blur hover:bg-white/10',
  muted: 'border border-surface-200 bg-surface-50 text-surface-700 hover:border-brand-300 hover:text-brand-800'
} as const;

const sizes = {
  sm: 'h-10 min-h-10 px-4 text-xs',
  md: 'h-11 min-h-11 px-5 text-xs',
  lg: 'h-12 min-h-12 px-6 text-sm',
  icon: 'h-10 w-10 min-h-10 min-w-10 px-0'
} as const;

export type SiteButtonVariant = keyof typeof variants;
export type SiteButtonSize = keyof typeof sizes;

type CommonProps = {
  variant?: SiteButtonVariant;
  size?: SiteButtonSize;
  className?: string;
  children: React.ReactNode;
};

type LinkProps = CommonProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className' | 'children'> & {
    href: string;
  };

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

export type SiteButtonProps = LinkProps | ButtonProps;

function siteButtonClassName({
  variant = 'outline',
  size = 'md',
  className
}: Pick<CommonProps, 'variant' | 'size' | 'className'>) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-black transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30',
    variants[variant],
    sizes[size],
    className
  );
}

export function SiteButton(props: SiteButtonProps) {
  const { variant = 'outline', size = 'md', className, children } = props;
  const classes = siteButtonClassName({ variant, size, className });

  if ('href' in props && props.href) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as LinkProps;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as ButtonProps;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

export { siteButtonClassName };
