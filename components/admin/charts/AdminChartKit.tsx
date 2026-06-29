'use client';

import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const CHART_COLORS = ['#d97706', '#0ea5e9', '#8b5cf6', '#10b981', '#f43f5e', '#6366f1', '#14b8a6', '#f59e0b'];

export function AdminChartCard({
  title,
  subtitle,
  icon,
  accent = 'amber',
  action,
  children
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: 'amber' | 'sky' | 'violet' | 'emerald' | 'rose';
  action?: ReactNode;
  children: ReactNode;
}) {
  const accents = {
    amber: 'from-amber-500/10 to-orange-500/5 text-amber-600',
    sky: 'from-sky-500/10 to-cyan-500/5 text-sky-600',
    violet: 'from-violet-500/10 to-purple-500/5 text-violet-600',
    emerald: 'from-emerald-500/10 to-teal-500/5 text-emerald-600',
    rose: 'from-rose-500/10 to-pink-500/5 text-rose-600'
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-l px-5 py-4 ${accents[accent]}`}>
        <div className="flex items-center gap-3">
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-lg shadow-sm ring-1 ring-black/5">
              {icon}
            </span>
          ) : null}
          <div>
            <h3 className="text-sm font-black text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function formatFa(n: number) {
  return n.toLocaleString('fa-IR');
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1 font-black text-slate-900" style={{ color: p.color }}>
          {p.name}: {valueFormatter ? valueFormatter(Number(p.value || 0)) : formatFa(Number(p.value || 0))}
        </p>
      ))}
    </div>
  );
}

export function AdminAreaTrendChart({
  data,
  xKey,
  series,
  height = 280
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; name: string; color: string }>;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={42} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              fill={`url(#grad-${s.key})`}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminBarTrendChart({
  data,
  xKey,
  yKey,
  name,
  color = CHART_COLORS[0],
  valueFormatter,
  height = 280
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Bar dataKey={yKey} name={name} fill={color} radius={[8, 8, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminLineTrendChart({
  data,
  xKey,
  series,
  height = 280
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; name: string; color: string }>;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={42} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminDonutChart({
  data,
  height = 260
}: {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900">{formatFa(total)}</span>
          <span className="text-[10px] font-bold text-slate-400">مجموع</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 text-xs font-bold text-slate-700">{d.name}</span>
            <span className="text-xs font-black text-slate-900">{formatFa(d.value)}</span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {Math.round((d.value / total) * 100).toLocaleString('fa-IR')}٪
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function formatDayLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString('fa-IR', { weekday: 'short', day: 'numeric' });
}

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec.toLocaleString('fa-IR')} ثانیه`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toLocaleString('fa-IR')} دقیقه${s ? ` و ${s.toLocaleString('fa-IR')} ثانیه` : ''}`;
}

export { CHART_COLORS };
