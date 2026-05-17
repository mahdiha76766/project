import type { ReactNode } from 'react';

export function AdminCard({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {title ? (
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}
