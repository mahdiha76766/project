import { formatJalaliDate, formatJalaliDateTime } from '@/lib/admin/jalali';
import { PRICE_CURRENCY_LABEL } from '@/lib/shop/price-currency';

export const formatDashDate = (value?: string | Date | null) => formatJalaliDate(value);

export const formatDashDateTime = (value?: string | Date | null) => formatJalaliDateTime(value);

export const formatDashCurrency = (value: unknown, suffix = PRICE_CURRENCY_LABEL) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `${num.toLocaleString('fa-IR')} ${suffix}`;
};

export const shortId = (value?: string | null, length = 8) => {
  if (!value) return '-';
  const clean = String(value);
  if (clean.length <= length) return clean;
  return clean.slice(-length);
};

export const shortCode = (value?: string | null) => {
  if (!value) return '-';
  const clean = String(value);
  const parts = clean.split('-');
  if (parts.length >= 3) return parts.slice(-1)[0];
  if (clean.length > 10) return clean.slice(-8);
  return clean;
};

/** نمایش شماره فاکتور ۶ رقمی */
export const formatInvoiceNumber = (value?: string | null) => {
  if (!value) return '-';
  const clean = String(value).trim();
  if (/^\d{6}$/.test(clean)) return clean;
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 6) return digits.slice(-6);
  if (digits.length > 0) return digits.padStart(6, '0');
  return clean;
};

/** @deprecated از formatInvoiceNumber استفاده کنید */
export const shortPaymentRef = formatInvoiceNumber;
