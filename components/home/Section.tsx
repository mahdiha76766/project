import { cn } from '@/lib/utils/cn';
import { Container } from '@/components/ui/Container';

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
  bg?: 'default' | 'white' | 'muted' | 'brand';
};

const bgMap = {
  default: 'bg-surface-50',
  white: 'bg-surface-0',
  muted: 'bg-surface-100',
  brand: 'bg-brand-50'
};

export function Section({ children, className, containerClassName, id, bg = 'default' }: SectionProps) {
  return (
    <section id={id} className={cn('site-section', bgMap[bg], className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
