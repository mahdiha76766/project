export type WholesaleDirection = 'less' | 'more';
export type WholesaleMode = 'percent' | 'amount';

/**
 * قیمت عمده از قیمت پایه:
 * - درصد: پایه ± ٪
 * - مبلغ: پایه ± تومان
 */
export function computeWholesalePrice(
  basePriceToman: number,
  opts: {
    direction?: WholesaleDirection;
    mode?: WholesaleMode;
    percent?: number | null;
    amount?: number | null;
    /** @deprecated ضریب حذف شد؛ نادیده گرفته می‌شود */
    multiplier?: number;
  } = {}
) {
  const base = Math.max(0, Number(basePriceToman) || 0);
  const direction: WholesaleDirection = opts.direction === 'more' ? 'more' : 'less';
  const mode: WholesaleMode = opts.mode === 'amount' ? 'amount' : 'percent';

  if (mode === 'amount') {
    const amount = Math.max(0, Math.round(Number(opts.amount) || 0));
    const raw = direction === 'more' ? base + amount : base - amount;
    return Math.max(0, Math.round(raw));
  }

  const p = Math.min(100, Math.max(0, Number(opts.percent) || 0));
  const raw = direction === 'more' ? base * (1 + p / 100) : base * (1 - p / 100);
  return Math.max(0, Math.round(raw));
}

export function normalizeWholesalePercent(value: unknown) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(1, n));
}

export function normalizeWholesaleAmount(value: unknown) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(999_999_999_999, n);
}

export function normalizeWholesaleDirection(value: unknown): WholesaleDirection {
  return value === 'more' ? 'more' : 'less';
}

export function normalizeWholesaleMode(value: unknown): WholesaleMode {
  return value === 'amount' ? 'amount' : 'percent';
}

/** @deprecated ضریب عمده حذف شد */
export function normalizeWholesaleMultiplier(_value?: unknown) {
  return 1;
}
