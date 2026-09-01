import { cn } from '@/lib/utils/cn';
import { resolveImage } from '@/lib/shop/resolve-image';

export function FpCircleImage({
  src,
  alt,
  className,
  size = 'lg'
}: {
  src: string;
  alt: string;
  className?: string;
  size?: 'md' | 'lg' | 'xl';
}) {
  const dims =
    size === 'xl'
      ? 'h-[22rem] w-[22rem] sm:h-[28rem] sm:w-[28rem]'
      : size === 'md'
        ? 'h-56 w-56 sm:h-64 sm:w-64'
        : 'h-72 w-72 sm:h-80 sm:w-80';

  return (
    <div className={cn('relative mx-auto flex items-center justify-center', className)}>
      <div className="ph-grid absolute h-[130%] w-[130%] rounded-full opacity-50" aria-hidden />
      <div className="absolute h-[118%] w-[118%] rounded-full border border-gold-400/40" aria-hidden />
      <div className="absolute -top-2 end-8 h-3 w-3 rounded-full bg-gold-400" aria-hidden />
      <div className={cn('ph-ring relative overflow-hidden rounded-full', dims)}>
        <img src={resolveImage(src)} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
