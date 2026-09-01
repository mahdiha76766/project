import { cn } from '@/lib/utils/cn';

export function FpCard({
  children,
  className,
  padded = true,
  as: Tag = 'div'
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  as?: 'div' | 'article' | 'section';
}) {
  return (
    <Tag className={cn('fp-card', padded && 'p-5 sm:p-6', className)}>
      {children}
    </Tag>
  );
}
