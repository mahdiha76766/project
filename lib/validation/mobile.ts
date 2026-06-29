const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

const toAsciiDigit = (char: string) => {
  const persian = PERSIAN_DIGITS.indexOf(char);
  if (persian >= 0) return String(persian);
  const arabic = ARABIC_DIGITS.indexOf(char);
  if (arabic >= 0) return String(arabic);
  return char;
};

/** Normalize Iranian mobile numbers to `09XXXXXXXXX`. */
export const normalizeMobile = (value: string): string => {
  let mobile = String(value || '')
    .trim()
    .replace(/[\u200c\u200b\uFEFF\u00a0]/g, '')
    .replace(/./g, toAsciiDigit)
    .replace(/[^\d]/g, '');

  if (mobile.startsWith('0098')) mobile = mobile.slice(4);
  else if (mobile.startsWith('98') && mobile.length >= 11) mobile = `0${mobile.slice(2)}`;
  else if (/^9\d{9}$/.test(mobile)) mobile = `0${mobile}`;

  return mobile;
};

export const isValidMobile = (value: string) => /^09\d{9}$/.test(normalizeMobile(value));
