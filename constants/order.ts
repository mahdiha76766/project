/** وضعیت‌های قابل انتخاب توسط ادمین و نمایش به کاربر */
export const MANAGEABLE_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED'
] as const;

export const ORDER_STATUSES = [
  ...MANAGEABLE_ORDER_STATUSES,
  'PACKED',
  'CANCELED',
  'RETURNED',
  'REFUNDED'
] as const;

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'] as const;

export const PAYMENT_TIMINGS = ['ONLINE', 'COD'] as const;

export const ORDER_PAYMENT_METHODS = ['WALLET', 'GATEWAY', 'MIXED', 'COD', 'SEP', 'CARD_TO_CARD'] as const;

export const RECEIPT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentTiming = (typeof PAYMENT_TIMINGS)[number];
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];
