'use client';

import { Check, Circle, Package, Truck, CreditCard, ClipboardCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STEP_ICONS: Record<string, LucideIcon> = {
  PENDING_PAYMENT: CreditCard,
  PAID: ClipboardCheck,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: Check
};

export function OrderProgressTracker({
  steps,
  activeIndex
}: {
  steps: Array<{ key: string; label: string }>;
  activeIndex: number;
}) {
  const progress = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-6 shadow-sm">
      <h3 className="text-sm font-black text-slate-800">روند سفارش</h3>
      <p className="mt-1 text-xs text-slate-500">وضعیت فعلی سفارش شما در مراحل زیر نمایش داده می‌شود</p>

      <div className="relative mt-8 hidden md:block">
        <div className="absolute right-8 left-8 top-5 h-1 rounded-full bg-slate-200" />
        <div
          className="absolute right-8 top-5 h-1 rounded-full bg-gradient-to-l from-amber-500 to-emerald-500 transition-all duration-700"
          style={{ width: `calc(${progress}% - 2rem)`, maxWidth: 'calc(100% - 4rem)' }}
        />
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const done = i < activeIndex;
            const current = i === activeIndex;
            const Icon = STEP_ICONS[step.key] || Circle;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2" style={{ width: `${100 / steps.length}%` }}>
                <span
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-all ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : current
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200 scale-110'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={`text-center text-[11px] font-bold leading-5 ${
                    done ? 'text-emerald-700' : current ? 'text-amber-800' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {steps.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          const Icon = STEP_ICONS[step.key] || Circle;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                current
                  ? 'border-amber-300 bg-amber-50'
                  : done
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : 'border-slate-100 bg-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  done ? 'bg-emerald-500 text-white' : current ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`text-sm font-bold ${current ? 'text-amber-900' : done ? 'text-emerald-800' : 'text-slate-500'}`}>
                {step.label}
              </span>
              {current ? <span className="mr-auto text-[10px] font-bold text-amber-700">فعلی</span> : null}
              {done ? <Check className="mr-auto h-4 w-4 text-emerald-600" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
