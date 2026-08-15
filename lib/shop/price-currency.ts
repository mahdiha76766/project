/** واحد پولی نمایش و منطق قیمت سایت — همه مبالغ در دیتابیس به تومان ذخیره می‌شوند. */
export const PRICE_CURRENCY_LABEL = 'تومان' as const;

/** برچسب کوتاه برای فیلدها: «قیمت پایه (تومان)» */
export function priceUnitSuffix(prefix = '') {
  return prefix ? `${prefix} (${PRICE_CURRENCY_LABEL})` : PRICE_CURRENCY_LABEL;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * هر ورودی قیمت (خالی، ؟، ?، متن نامعتبر، …) را به عدد تومان ≥ ۰ تبدیل می‌کند.
 * برای ذخیره در پورتال/ادمین/اکسل — نه برای فرمت قدیمی شیت «قیمت» (هزار تومان).
 */
export function coercePriceToman(raw: unknown): number {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) return 0;
    return Math.round(raw);
  }
  if (raw == null || typeof raw === 'boolean') return 0;

  let text = String(raw).trim();
  if (!text) return 0;

  text = text
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));

  // علامت‌ها و متن‌های جایگزین قیمت
  if (/^(?:[?؟\-–—_./\\*xX×#]+|n\/?a|null|undefined|none|نامشخص|ندارد)$/i.test(text)) {
    return 0;
  }

  text = text
    .replace(/ریال|تومان|toman|rial/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .replace(/[^\d.]/g, '');

  if (!text || text === '.') return 0;
  const num = Number(text);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num);
}
