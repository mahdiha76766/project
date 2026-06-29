'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, Package, RefreshCw, User, X } from 'lucide-react';
import { AdminOrderCard } from '@/components/admin/AdminOrderCard';
import type { AdminOrderRow } from '@/components/admin/admin-order-types';
import { AddressMapView } from '@/components/shop/AddressMapView';
import { adminFetch } from '@/lib/admin/client';
import { formatDate } from '@/lib/admin/table-formats';
import { shortId } from '@/lib/dashboard/formats';

export type LiveOrder = AdminOrderRow;

const POLL_MS = 5000;

export function AdminLiveOrders({ initialOrders }: { initialOrders: LiveOrder[] }) {
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);
  const [live, setLive] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('');
  const [savingId, setSavingId] = useState('');
  const [panelByOrder, setPanelByOrder] = useState<Record<string, 'items' | 'tracking' | null>>({});
  const [mapOrder, setMapOrder] = useState<LiveOrder | null>(null);
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
  const [trackingUrlDraft, setTrackingUrlDraft] = useState<Record<string, string>>({});
  const knownIds = useRef(new Set(initialOrders.map((o) => o._id)));
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    const res = await adminFetch<{ items: LiveOrder[]; fetchedAt: string }>('/api/admin/dashboard/orders');
    if (manual) setSyncing(false);
    if (!res.ok || !res.data?.items) return;

    const incoming = res.data.items;
    const freshIds = incoming.filter((o) => !knownIds.current.has(o._id)).map((o) => o._id);
    if (freshIds.length) {
      setNewOrderIds((prev) => new Set([...prev, ...freshIds]));
      window.setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          freshIds.forEach((id) => next.delete(id));
          return next;
        });
      }, 25000);
    }
    knownIds.current = new Set(incoming.map((o) => o._id));
    setOrders(incoming);
    setLastSync(res.data.fetchedAt);
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => void fetchOrders(), POLL_MS);
    return () => clearInterval(id);
  }, [live, fetchOrders]);

  const updateOrder = async (orderId: string, patch: Record<string, string>) => {
    setSavingId(orderId);
    const res = await adminFetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    setSavingId('');
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, ...patch } : o)));
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/50 to-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Package className="h-4 w-4" />
              {live ? (
                <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              ) : null}
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900">سفارش‌های زنده</h2>
              <p className="text-[10px] text-slate-500">
                {lastSync ? formatDate(lastSync) : 'در حال اتصال...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLive((v) => !v)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${
                live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {live ? '● زنده' : 'متوقف'}
            </button>
            <button
              type="button"
              onClick={() => void fetchOrders(true)}
              disabled={syncing}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/admin/orders" className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white">
              همه
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">سفارشی ثبت نشده است</div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((o) => (
              <AdminOrderCard
                key={o._id}
                order={o}
                isNew={newOrderIds.has(o._id)}
                isSaving={savingId === o._id}
                panel={panelByOrder[o._id] ?? null}
                onPanelChange={(p) => setPanelByOrder((prev) => ({ ...prev, [o._id]: p }))}
                onMap={() => setMapOrder(o)}
                onUpdate={(patch) => void updateOrder(o._id, patch)}
                trackingDraft={trackingDraft[o._id] ?? o.trackingCode ?? ''}
                trackingUrlDraft={trackingUrlDraft[o._id] ?? o.trackingUrl ?? ''}
                onTrackingDraft={(v) => setTrackingDraft({ ...trackingDraft, [o._id]: v })}
                onTrackingUrlDraft={(v) => setTrackingUrlDraft({ ...trackingUrlDraft, [o._id]: v })}
              />
            ))}
          </div>
        )}
      </section>

      {mapOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setMapOrder(null)}
        >
          <div
            className="max-h-[88vh] w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-sky-600" />
                <div>
                  <h3 className="text-xs font-black">آدرس #{shortId(mapOrder._id)}</h3>
                </div>
              </div>
              <button type="button" onClick={() => setMapOrder(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            {mapOrder.shippingAddress ? (
              <div className="space-y-3 p-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 text-xs">
                  <p className="font-bold">{mapOrder.shippingAddress.fullName}</p>
                  <p className="mt-1 text-slate-600">{mapOrder.shippingAddress.province}، {mapOrder.shippingAddress.city}</p>
                  <p className="mt-1 text-slate-500">{mapOrder.shippingAddress.addressLine}</p>
                </div>
                {mapOrder.shippingAddress.latitude != null && mapOrder.shippingAddress.longitude != null ? (
                  <AddressMapView
                    latitude={mapOrder.shippingAddress.latitude}
                    longitude={mapOrder.shippingAddress.longitude}
                    heightClass="h-44"
                  />
                ) : (
                  <p className="flex items-center gap-2 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800">
                    <MapPin className="h-4 w-4" />
                    موقعیت نقشه ثبت نشده
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
