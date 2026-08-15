'use client';

import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { AdminOrderCard } from '@/components/admin/AdminOrderCard';
import type { AdminOrderRow } from '@/components/admin/admin-order-types';
import { AddressMapView } from '@/components/shop/AddressMapView';
import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPagination
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { useAdminList } from '@/hooks/useAdminList';
import { shortId } from '@/lib/dashboard/formats';

type Order = AdminOrderRow;

export default function AdminOrdersPage() {
  const [userId, setUserId] = useState('');
  useEffect(() => {
    setUserId(new URLSearchParams(window.location.search).get('userId') ?? '');
  }, []);
  const endpoint = userId ? `/api/admin/orders?userId=${userId}` : '/api/admin/orders';
  const { items, page, setPage, totalPages, total, loading, error, reload } = useAdminList<Order>(endpoint);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [panelByOrder, setPanelByOrder] = useState<Record<string, 'items' | 'tracking' | null>>({});
  const [trackingDraft, setTrackingDraft] = useState<Record<string, string>>({});
  const [trackingUrlDraft, setTrackingUrlDraft] = useState<Record<string, string>>({});
  const [mapOrder, setMapOrder] = useState<Order | null>(null);

  const updateOrder = async (id: string, patch: Record<string, string>) => {
    setFormError('');
    setSavingId(id);
    const { ok, error: updateError } = await adminFetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    setSavingId('');
    if (!ok) setFormError(updateError);
    else {
      setMessage('سفارش به‌روزرسانی شد.');
      reload();
    }
  };

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="مدیریت سفارش‌ها"
        description={userId ? 'فیلتر بر اساس کاربر انتخاب‌شده' : `${total.toLocaleString('fa-IR')} سفارش — ویرایش وضعیت، اقلام و پیگیری`}
      />

      {formError ? <AdminAlert tone="error">{formError}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminCard title="سفارش‌ها">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">سفارشی یافت نشد</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((o) => (
              <AdminOrderCard
                key={o._id}
                order={o}
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
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>

      {mapOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setMapOrder(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-black">آدرس تحویل</h3>
                <p className="text-xs text-slate-500">
                  #{shortId(mapOrder._id)} — {mapOrder.user?.name || mapOrder.user?.mobile}
                </p>
              </div>
              <button type="button" onClick={() => setMapOrder(null)} className="rounded-lg p-1.5 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            {mapOrder.shippingAddress ? (
              <div className="space-y-3 p-4 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold">{mapOrder.shippingAddress.fullName} — {mapOrder.shippingAddress.phone}</p>
                  <p className="mt-1 text-slate-600">
                    {mapOrder.shippingAddress.province}، {mapOrder.shippingAddress.city}، {mapOrder.shippingAddress.addressLine}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">کدپستی: {mapOrder.shippingAddress.postalCode}</p>
                </div>
                {mapOrder.shippingAddress.latitude != null && mapOrder.shippingAddress.longitude != null ? (
                  <AddressMapView
                    latitude={mapOrder.shippingAddress.latitude}
                    longitude={mapOrder.shippingAddress.longitude}
                    heightClass="h-52"
                  />
                ) : (
                  <p className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
                    <MapPin className="h-4 w-4" />
                    موقعیت روی نقشه ثبت نشده
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
