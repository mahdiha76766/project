import { cn } from '@/lib/utils/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8'
};

export const Card = ({ children, className, padding = 'md', hover }: CardProps) => (
  <div
    className={cn(
      'rounded-2xl border border-surface-200 bg-surface-0 shadow-soft',
      paddingMap[padding],
      hover && 'transition hover:-translate-y-0.5 hover:shadow-card-hover',
      className
    )}
  >
    {children}
  </div>
);
