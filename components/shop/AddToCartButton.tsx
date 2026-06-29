'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';

export function AddToCartButton({
  productId,
  variantId,
  disabled,
  className = 'site-btn-primary mt-6 w-full sm:w-auto'
}: {
  productId: string;
  variantId?: string;
  disabled?: boolean;
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
    <div>
      <button type="button" onClick={add} disabled={disabled || loading} className={className}>
        {loading ? 'در حال افزودن...' : 'افزودن به سبد'}
        {!loading ? <RtlForwardArrow className="text-white" /> : null}
      </button>
      {message ? (
        <p className={`mt-2 text-sm font-medium ${message.includes('خطا') || message.includes('ابتدا') ? 'text-red-600' : 'text-brand-700'}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
