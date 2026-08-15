/** Round UP to nearest step (excel site_prices uses 10,000 تومان steps). */
export const SITE_PRICE_ROUND_STEP = 10_000;

export function roundUpToStep(value: number, step = SITE_PRICE_ROUND_STEP) {
  const n = Math.max(0, Number(value) || 0);
  if (step <= 0) return Math.round(n);
  return Math.ceil(n / step) * step;
}

/** Base price + percent (1–100) → site price, rounded up like products.xlsx */
export function computeSitePrice(basePriceToman: number, percent: number) {
  const base = Math.max(0, Number(basePriceToman) || 0);
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const raw = base * (1 + p / 100);
  return roundUpToStep(raw, SITE_PRICE_ROUND_STEP);
}

export function normalizeSitePercent(value: unknown) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(1, n));
}
