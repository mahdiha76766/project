export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
  'RETURNED',
  'REFUNDED'
] as const;

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
