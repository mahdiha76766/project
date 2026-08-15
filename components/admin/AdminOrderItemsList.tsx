'use client';

import { Package } from 'lucide-react';
import { formatCurrency } from '@/lib/admin/table-formats';
import { resolveImageUrl } from '@/lib/admin/table-formats';
import { itemCount, productImage, productName, type AdminOrderRow } from '@/components/admin/admin-order-types';

export function AdminOrderItemsList({ order }: { order: AdminOrderRow }) {
  const items = order.items ?? [];
  const totalQty = itemCount(order);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!items.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-4 text-xs text-slate-500">
        <Package className="h-4 w-4 shrink-0" />
        اقلام این سفارش یافت نشد
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-amber-50/80 to-white px-3 py-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">اقلام سفارش</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
          {totalQty.toLocaleString('fa-IR')} عدد
        </span>
      </div>
      <ul className="divide-y divide-slate-50">
        {items.map((it, idx) => {
          const img = productImage(it);
          return (
            <li key={idx} className="flex items-center gap-2.5 px-3 py-2 transition hover:bg-slate-50/80">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
                {img ? (
                  <img src={resolveImageUrl(img)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-300">
                    <Package className="h-3.5 w-3.5" />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{productName(it)}</p>
                <p className="text-[10px] text-slate-400">
                  {formatCurrency(it.price, 'تومان')} × {Number(it.quantity).toLocaleString('fa-IR')}
                  {it.sku ? ` · SKU: ${it.sku}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs font-black text-slate-900">
                {formatCurrency(it.price * it.quantity, 'تومان')}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-[10px]">
        <span className="font-bold text-slate-500">جمع اقلام</span>
        <span className="font-black text-slate-800">{formatCurrency(subtotal, 'تومان')}</span>
      </div>
    </div>
  );
}
