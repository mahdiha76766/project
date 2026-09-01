'use client';

import { useEffect, useState } from 'react';
import { useSalesConfig } from '@/components/commerce/SalesProvider';

export function CartBadge() {
  const { salesEnabled } = useSalesConfig();
  const [count, setCount] = useState(0);

  const load = async () => {
    const res = await fetch('/api/cart');
    const data = await res.json();
    setCount(data.count ?? 0);
  };

  useEffect(() => {
    if (!salesEnabled) return;
    void load();
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ count?: number }>).detail;
      if (detail?.count !== undefined) setCount(detail.count);
      else void load();
    };
    window.addEventListener('cart-updated', onUpdate);
    return () => window.removeEventListener('cart-updated', onUpdate);
  }, [salesEnabled]);

  if (!salesEnabled || !count) return null;
  return (
    <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
