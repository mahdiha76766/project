'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AdminAlert } from '@/components/admin/ui';

type Tone = 'success' | 'error' | 'info';
type Toast = { id: number; tone: Tone; text: string };

type ToastContextValue = {
  notify: (text: string, tone?: Tone) => void;
};

const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const notify = useCallback((text: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-4), { id, tone, text }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[90] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" dir="rtl">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto shadow-lg">
            <AdminAlert tone={item.tone}>{item.text}</AdminAlert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  return useContext(ToastContext);
}
