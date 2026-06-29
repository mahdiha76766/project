export const SHIPPING_METHOD_CODES = ['POST', 'TIPAX', 'SNAPP'] as const;

export const SHIPPING_PAYMENT_TIMINGS = ['ONLINE', 'ON_DELIVERY'] as const;

export type ShippingMethodCode = (typeof SHIPPING_METHOD_CODES)[number];
export type ShippingPaymentTiming = (typeof SHIPPING_PAYMENT_TIMINGS)[number];

export const DEFAULT_SHIPPING_ON_DELIVERY: Record<ShippingMethodCode, boolean> = {
  POST: false,
  TIPAX: true,
  SNAPP: true
};
