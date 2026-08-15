const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

function normalizeSizeText(value: string) {
  return toEnglishDigits(String(value || ''))
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const WORD_AMOUNT: Record<string, number> = {
  نیم: 0.5,
  نصف: 0.5,
  یک: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5
};

/**
 * استخراج مقدار قابل‌مقایسه از برچسب وزن/حجم واریانت.
 * حجم → میلی‌لیتر ، وزن → گرم (برای مایعات تقریباً هم‌ارز).
 */
export function parseVariantSizeAmount(...parts: Array<string | number | null | undefined>): number | null {
  const raw = parts
    .map((p) => (p == null ? '' : String(p)))
    .filter(Boolean)
    .join(' ');
  const text = normalizeSizeText(raw);
  if (!text) return null;

  // صریح: عدد + واحد
  const numericUnit =
    /(\d+(?:\.\d+)?)\s*(میلی\s*لیتر|میلیلیتر|میلی\s*ل|میل(?!\w)|ml|سی\s*سی|cc|لیتر|لیتری|l(?![a-z])|کیلوگرم|کیلو|kg|گرم|g(?![a-z]))/i.exec(
      text
    );
  if (numericUnit) {
    const n = Number(numericUnit[1]);
    const unit = numericUnit[2].replace(/\s+/g, '');
    if (!Number.isFinite(n) || n <= 0) return null;
    if (/^(میلی|میل|ml|سیسی|cc)/i.test(unit)) return Math.round(n);
    if (/^(لیتر|لیتری|^l$)/i.test(unit) || unit === 'l') return Math.round(n * 1000);
    if (/^(کیلو|kg)/i.test(unit)) return Math.round(n * 1000);
    if (/^(گرم|^g$)/i.test(unit) || unit === 'g') return Math.round(n);
  }

  // نیم لیتر / نصف لیتری
  if (/(?:^|\s)(نیم|نصف)\s*(لیتر|لیتری)/.test(text)) return 500;

  // یک لیتر / دو لیتری بدون عدد لاتین
  const wordLiter = /(?:^|\s)(نیم|نصف|یک|دو|سه|چهار|پنج)\s*(لیتر|لیتری)(?:\s|$)/.exec(text);
  if (wordLiter) {
    const mul = WORD_AMOUNT[wordLiter[1]];
    if (mul) return Math.round(mul * 1000);
  }

  // فقط «لیتری» بدون عدد → فرض ۱ لیتر
  if (/(?:^|\s)لیتری(?:\s|$)/.test(text) && !/\d/.test(text)) return 1000;

  // عدد تنها اگر زمینه لیتر/وزن در متن باشد
  const bare = /(\d+(?:\.\d+)?)/.exec(text);
  if (bare && /(لیتر|میل|کیلو|گرم|ml|kg)/i.test(text)) {
    const n = Number(bare[1]);
    if (!Number.isFinite(n) || n <= 0) return null;
    if (/میل|ml/i.test(text)) return Math.round(n);
    if (/کیلو|kg/i.test(text)) return Math.round(n * 1000);
    if (/گرم/i.test(text) && !/کیلو/.test(text)) return Math.round(n);
    if (/لیتر/i.test(text)) return n < 20 ? Math.round(n * 1000) : Math.round(n);
  }

  return null;
}

/** گرد کردن تمیز قیمت نسبی (نزدیک‌ترین هزار تومان وقتی اختلاف بزرگ است) */
export function roundProportionalPrice(value: number) {
  const n = Math.max(0, Number(value) || 0);
  if (n < 1000) return Math.round(n);
  return Math.round(n / 1000) * 1000;
}

export function scalePriceBySizeRatio(opts: {
  sourceOldPrice: number;
  sourceNewPrice: number;
  sourceSize: number;
  targetOldPrice: number;
  targetSize: number;
}) {
  const sourceSize = Number(opts.sourceSize);
  const targetSize = Number(opts.targetSize);
  if (!(sourceSize > 0) || !(targetSize > 0)) return null;

  const delta = Number(opts.sourceNewPrice) - Number(opts.sourceOldPrice);
  if (!Number.isFinite(delta) || delta === 0) return Math.max(0, Math.round(Number(opts.targetOldPrice) || 0));

  const scaled = Number(opts.targetOldPrice) + delta * (targetSize / sourceSize);
  return roundProportionalPrice(scaled);
}
