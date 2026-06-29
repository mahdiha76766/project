export const DASHBOARD_RANGE_OPTIONS = [
  { value: 7, label: '۷ روز' },
  { value: 14, label: '۱۴ روز' },
  { value: 30, label: '۳۰ روز' },
  { value: 90, label: '۹۰ روز' }
] as const;

export type DashboardRangeDays = (typeof DASHBOARD_RANGE_OPTIONS)[number]['value'];

export function parseDashboardRange(input: string | null | undefined): DashboardRangeDays {
  const n = Number(input);
  const allowed = DASHBOARD_RANGE_OPTIONS.map((o) => o.value);
  return (allowed.includes(n as DashboardRangeDays) ? n : 7) as DashboardRangeDays;
}
