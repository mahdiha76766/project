import { cn } from '@/lib/utils/cn';

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
};

const sizeMap = {
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl'
};

export const PageShell = ({ children, className, size = 'xl' }: PageShellProps) => (
  <main className={cn('mx-auto w-full px-4 py-8 sm:px-6 lg:py-10', sizeMap[size], className)}>{children}</main>
);
