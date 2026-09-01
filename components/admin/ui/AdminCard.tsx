import type { ReactNode } from 'react';

export function AdminCard({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-paper-200 bg-paper-50 p-5 shadow-soft">
      {title ? (
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-ink-900">{title}</h2>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}
