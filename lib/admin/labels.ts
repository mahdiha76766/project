import { SHIPPING_METHOD_CODES } from '@/constants/shipping';
import { MANAGEABLE_ORDER_STATUSES, ORDER_STATUSES, PAYMENT_STATUSES } from '@/constants/order';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAID: 'پرداخت شده',
  PROCESSING: 'در حال پردازش',
  PACKED: 'در حال پردازش',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELED: 'لغو شده',
  RETURNED: 'مرجوع شده',
  REFUNDED: 'بازپرداخت شده'
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق',
  CANCELED: 'لغو شده',
  REFUNDED: 'بازپرداخت شده'
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  PERCENT: 'درصدی',
  FIXED: 'مبلغ ثابت',
  FREE_SHIPPING: 'ارسال رایگان'
};

export const SHIPPING_CODE_LABELS: Record<string, string> = {
  POST: 'پست',
  TIPAX: 'تیپاکس',
  SNAPP: 'اسنپ'
};

export const PAYMENT_TIMING_LABELS: Record<string, string> = {
  ONLINE: 'پرداخت آنلاین',
  COD: 'پرداخت در محل'
};

export const manageableOrderStatusOptions = MANAGEABLE_ORDER_STATUSES.map((v) => ({
  value: v,
  label: ORDER_STATUS_LABELS[v] || v
}));

export const orderStatusOptions = ORDER_STATUSES.map((v) => ({
  value: v,
  label: ORDER_STATUS_LABELS[v] || v
}));
export const paymentStatusOptions = PAYMENT_STATUSES.map((v) => ({ value: v, label: PAYMENT_STATUS_LABELS[v] || v }));
export const shippingCodeOptions = SHIPPING_METHOD_CODES.map((v) => ({ value: v, label: SHIPPING_CODE_LABELS[v] || v }));

export const labelOf = (map: Record<string, string>, value: string) => map[value] || value;
