const TEHRAN_TZ = 'Asia/Tehran';

/** کلید تاریخ YYYY-MM-DD بر اساس منطقه زمانی تهران */
export function tehranDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TEHRAN_TZ });
}

/** شروع روز جاری در تهران (به UTC تبدیل‌شده برای کوئری) */
export function startOfTodayTehran() {
  const key = tehranDateKey();
  return new Date(`${key}T00:00:00+03:30`);
}

/** شروع ماه جاری در تهران */
export function startOfMonthTehran() {
  const key = tehranDateKey();
  const [y, m] = key.split('-');
  return new Date(`${y}-${m}-01T00:00:00+03:30`);
}

/** ۷ روز اخیر به‌صورت کلید تاریخ تهران */
export function lastNDaysTehran(n: number) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(tehranDateKey(d));
  }
  return days;
}

export function fillDailySeries(
  days: string[],
  rows: Array<{ _id: string; amount?: number; count?: number }>,
  valueKey: 'amount' | 'count'
) {
  const map = new Map(rows.map((r) => [r._id, r[valueKey] ?? 0]));
  return days.map((date) => ({
    date,
    [valueKey]: map.get(date) ?? 0
  }));
}

export const MONGO_TEHRAN_DATE = {
  $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TEHRAN_TZ }
};

export const MONGO_TEHRAN_DATE_VERIFIED = {
  $dateToString: { format: '%Y-%m-%d', date: '$verifiedAt', timezone: TEHRAN_TZ }
};
