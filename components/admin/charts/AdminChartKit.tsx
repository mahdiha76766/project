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

const TICK = { fontSize: 10, fill: '#64748b' } as const;
const CHART_MARGIN = { top: 4, right: 4, left: 0, bottom: 2 };

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
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-l px-3.5 py-2.5 ${accents[accent]}`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-base shadow-sm ring-1 ring-black/5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-black leading-snug text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-3.5">{children}</div>
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
    <div className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-lg">
      <p className="truncate font-bold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 font-black text-slate-900" style={{ color: p.color }}>
          {p.name}: {valueFormatter ? valueFormatter(Number(p.value || 0)) : formatFa(Number(p.value || 0))}
        </p>
      ))}
    </div>
  );
}

function xAxisProps(dataLength: number) {
  const crowded = dataLength > 14;
  return {
    tick: TICK,
    axisLine: false as const,
    tickLine: false as const,
    interval: crowded ? Math.ceil(dataLength / 8) - 1 : ('preserveStartEnd' as const),
    minTickGap: crowded ? 12 : 8,
    height: crowded ? 36 : 24,
    angle: crowded ? -35 : 0,
    textAnchor: crowded ? ('end' as const) : ('middle' as const)
  };
}

export function AdminAreaTrendChart({
  data,
  xKey,
  series,
  height = 200
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; name: string; color: string }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} {...xAxisProps(data.length)} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconSize={8} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              fill={`url(#grad-${s.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3.5 }}
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
  height = 200
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
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} {...xAxisProps(data.length)} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Bar dataKey={yKey} name={name} fill={color} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminLineTrendChart({
  data,
  xKey,
  series,
  height = 200
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ key: string; name: string; color: string }>;
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={xKey} {...xAxisProps(data.length)} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconSize={8} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminDonutChart({
  data,
  height = 180
}: {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:items-center">
      <div style={{ height }} className="relative mx-auto w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={`${entry.name}-${i}`} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black leading-none text-slate-900">{formatFa(total)}</span>
          <span className="mt-0.5 text-[10px] font-bold text-slate-400">مجموع</span>
        </div>
      </div>
      <div className="max-h-[180px] space-y-1 overflow-y-auto pr-0.5">
        {data.map((d, i) => (
          <div
            key={`${d.name}-${i}`}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: d.color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-700" title={d.name}>
              {d.name}
            </span>
            <span className="shrink-0 text-[11px] font-black text-slate-900">{formatFa(d.value)}</span>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
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
  return d.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' });
}

export function formatDuration(sec: number) {
  if (sec < 60) return `${sec.toLocaleString('fa-IR')} ثانیه`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toLocaleString('fa-IR')} دقیقه${s ? ` و ${s.toLocaleString('fa-IR')} ثانیه` : ''}`;
}

export { CHART_COLORS };
