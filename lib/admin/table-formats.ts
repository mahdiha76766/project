import { formatJalaliDate } from '@/lib/admin/jalali';
import { PRICE_CURRENCY_LABEL } from '@/lib/shop/price-currency';

export const formatCurrency = (value: unknown, suffix = PRICE_CURRENCY_LABEL) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `${num.toLocaleString('fa-IR')} ${suffix}`;
};

export const formatNumber = (value: unknown) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('fa-IR');
};

export const formatDate = (value: unknown) => formatJalaliDate(String(value || ''));

export const formatText = (value: unknown, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

export const resolveImageUrl = (url?: string, fallback = '/og-default.jpg') => {
  if (!url) return fallback;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/${url}`;
};
