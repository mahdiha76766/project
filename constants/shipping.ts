export const SHIPPING_METHOD_CODES = [
  'EXPRESS_POST',
  'TIPAX',
  'CITY_COURIER',
  'PICKUP',
  'FREE_OVER_THRESHOLD',
  'HEAVY_FREIGHT'
] as const;

export type ShippingMethodCode = (typeof SHIPPING_METHOD_CODES)[number];
