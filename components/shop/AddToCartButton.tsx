'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';

export function AddToCartButton({
  productId,
  variantId,
  disabled,
  compact = false,
  className = 'site-btn-primary mt-6 w-full sm:w-auto'
}: {
  productId: string;
  variantId?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const add = async () => {
    setLoading(true);
    setMessage('');
    const payload: { productId: string; quantity: number; variantId?: string } = {
      productId,
      quantity: 1
    };
    if (variantId) payload.variantId = variantId;

    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      router.push('/auth/login?next=/cart');
      return;
    }
    if (!res.ok) {
      setMessage(data.error || 'خطا در افزودن به سبد');
      return;
    }
    if (!data.count || !data.items?.length) {
      setMessage('افزودن به سبد انجام نشد. لطفاً دوباره تلاش کنید.');
      return;
    }
    setMessage('به سبد اضافه شد');
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: data.count } }));
  };

  return (
    <div className={compact ? 'relative' : undefined}>
      <button
        type="button"
        onClick={add}
        disabled={disabled || loading}
        aria-label={compact ? 'افزودن به سبد خرید' : undefined}
        className={compact ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-lg shadow-brand-900/10 transition hover:bg-accent-500 disabled:opacity-60' : className}
      >
        {compact ? <ShoppingBag className="h-4 w-4" /> : (loading ? 'در حال افزودن...' : 'افزودن به سبد')}
        {!compact && !loading ? <RtlForwardArrow className="text-white" /> : null}
      </button>
      {message && !compact ? (
        <p className={`mt-2 text-sm font-medium ${message.includes('خطا') || message.includes('ابتدا') ? 'text-red-600' : 'text-brand-700'}`}>
          {message}
        </p>
      ) : null}
      {message && compact ? (
        <span className={`absolute bottom-full left-0 z-20 mb-2 w-max max-w-44 rounded-xl px-3 py-2 text-[10px] font-bold text-white shadow-lg ${message.includes('خطا') ? 'bg-rose-600' : 'bg-brand-800'}`}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
