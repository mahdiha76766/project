import { cn } from '@/lib/utils/cn';

export function FpSkeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-surface-100', className)} aria-hidden />;
}

export function FpProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white">
      <FpSkeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-5">
        <FpSkeleton className="h-4 w-2/3" />
        <FpSkeleton className="h-3 w-full" />
        <FpSkeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}
