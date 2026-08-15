'use client';

import { useEffect, useState } from 'react';
import { AdminCard, AdminPageHeader } from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';

export default function AdminFinanceStatsPage() {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [trend, setTrend] = useState<{ payments: Array<{ _id: string; count: number; amount: number }> }>({ payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [s, t] = await Promise.all([
        adminFetch<{ summary: Record<string, number> }>('/api/finance/stats/summary'),
        adminFetch<{ trend: { payments: Array<{ _id: string; count: number; amount: number }> } }>('/api/finance/stats/trend')
      ]);
      if (s.ok && s.data) setSummary(s.data.summary);
      if (t.ok && t.data) setTrend(t.data.trend);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="space-y-6">
      <AdminPageHeader title="آمار مالی" description="گزارش روزانه و ماهانه تراکنش‌ها و پرداخت‌ها" />
      {loading ? <p>در حال بارگذاری...</p> : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['موجودی قابل برداشت', summary.totalAvailableBalance],
              ['موجودی بلوکه', summary.totalBlockedBalance],
              ['پرداخت‌های امروز', summary.paidTodayCount],
              ['مبلغ پرداخت امروز', summary.paidTodayAmount]
            ].map(([label, value]) => (
              <AdminCard key={String(label)}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-black">{(value ?? 0).toLocaleString('fa-IR')}</p>
              </AdminCard>
            ))}
          </div>
          <AdminCard>
            <h2 className="font-bold">روند پرداخت‌ها</h2>
            <div className="mt-4 space-y-2">
              {trend.payments.map((p) => (
                <div key={p._id} className="flex justify-between rounded-xl border px-3 py-2 text-sm">
                  <span>{p._id}</span>
                  <span>{p.count} پرداخت — {p.amount.toLocaleString('fa-IR')} تومان</span>
                </div>
              ))}
            </div>
          </AdminCard>
        </>
      )}
    </main>
  );
}
