'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function WishlistButton({ productId, compact = false, className }: { productId: string; compact?: boolean; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');

  const save = async () => {
    if (status === 'loading' || status === 'saved') return;
    setStatus('loading');
    try {
      const response = await fetch('/api/dashboard/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ productId })
      });
      if (response.status === 401) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!response.ok) throw new Error('wishlist_failed');
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={compact ? 'relative' : 'w-full'}>
      <button
        type="button"
        onClick={() => void save()}
        disabled={status === 'loading'}
        aria-label={compact ? (status === 'saved' ? 'ذخیره‌شده در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها') : undefined}
        className={cn(
          compact
            ? 'flex h-11 w-11 items-center justify-center rounded-2xl border border-surface-200 bg-white text-surface-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
            : 'site-btn-outline w-full !rounded-xl',
          status === 'saved' && 'border-rose-200 bg-rose-50 text-rose-600',
          className
        )}
      >
        {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn('h-4 w-4', status === 'saved' && 'fill-current')} />}
        {!compact ? <span>{status === 'saved' ? 'ذخیره شد' : 'افزودن به علاقه‌مندی‌ها'}</span> : null}
      </button>
      {status === 'error' ? <p className={compact ? 'absolute left-0 top-full z-20 mt-2 w-max rounded-lg bg-rose-600 px-2 py-1 text-[10px] text-white' : 'mt-2 text-xs font-bold text-rose-600'}>ثبت علاقه‌مندی انجام نشد.</p> : null}
    </div>
  );
}
