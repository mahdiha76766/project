import type { ReactNode } from 'react';

export const AdminStatCard = ({
  title,
  value,
  hint,
  icon: Icon,
  href,
  accent = 'amber'
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  accent?: 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
}) => {
  const accents = {
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    sky: 'bg-sky-100 text-sky-700',
    violet: 'bg-violet-100 text-violet-700',
    rose: 'bg-rose-100 text-rose-700'
  };
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accents[accent]}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
  if (href) return <a href={href} className="block">{content}</a>;
  return content;
};

export const AdminPageBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-gradient-to-l from-amber-50 via-white to-white p-5 shadow-sm">
    <h1 className="text-xl font-black text-slate-900">{title}</h1>
    {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
  </div>
);

export const AdminBadge = ({
  label,
  tone = 'slate'
}: {
  label: string;
  tone?: 'slate' | 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';
}) => {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    rose: 'bg-rose-100 text-rose-800',
    sky: 'bg-sky-100 text-sky-800',
    violet: 'bg-violet-100 text-violet-800'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{label}</span>;
};

export const AdminCard = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    {title ? (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-slate-800">{title}</h2>
        {action}
      </div>
    ) : null}
    {children}
  </section>
);

export const AdminLoading = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
    ))}
  </div>
);
