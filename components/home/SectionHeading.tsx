import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { RtlForwardArrow } from './RtlForwardArrow';

type SectionHeadingProps = {
  label?: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  center?: boolean;
  className?: string;
};

export function SectionHeading({
  label,
  title,
  description,
  href,
  linkText = 'مشاهده همه',
  center,
  className
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'mb-10 flex flex-wrap items-end justify-between gap-4 lg:mb-12',
        center && 'flex-col items-center text-center',
        className
      )}
    >
      <div className={cn(center && 'max-w-xl')}>
        {label ? <p className="site-label mb-2">{label}</p> : null}
        <h2 className="site-heading">{title}</h2>
        {description ? <p className="site-subtext mt-3">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="site-link group">
          {linkText}
          <RtlForwardArrow className="transition group-hover:-translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
