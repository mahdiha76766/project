/**
 * Persian-aware alphabetical ordering for product names (Excel «قیمت» sheet).
 */

const PERSIAN_COLLATOR = new Intl.Collator('fa', {
  numeric: true,
  sensitivity: 'base',
  ignorePunctuation: true
});

export function normalizePersianSortName(name: string) {
  return String(name || '')
    .trim()
    .replace(/[\u200c\u200d\u200e\u200f\ufeff]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s+/g, ' ');
}

export function comparePersianNames(a: string, b: string) {
  return PERSIAN_COLLATOR.compare(normalizePersianSortName(a), normalizePersianSortName(b));
}
