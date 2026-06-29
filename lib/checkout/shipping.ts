import mongoose from 'mongoose';
import { ShippingMethod } from '@/models';
import {
  DEFAULT_SHIPPING_ON_DELIVERY,
  SHIPPING_METHOD_CODES,
  type ShippingMethodCode,
  type ShippingPaymentTiming
} from '@/constants/shipping';

const FALLBACK_COSTS: Record<
  ShippingMethodCode,
  { name: string; baseCost: number; costPerKg: number; estimatedDays: number; allowShippingOnDelivery: boolean }
> = {
  POST: { name: 'پست', baseCost: 90000, costPerKg: 25000, estimatedDays: 5, allowShippingOnDelivery: false },
  TIPAX: { name: 'تیپاکس', baseCost: 120000, costPerKg: 0, estimatedDays: 3, allowShippingOnDelivery: true },
  SNAPP: { name: 'اسنپ', baseCost: 150000, costPerKg: 0, estimatedDays: 1, allowShippingOnDelivery: true }
};

export type ShippingLineItem = { quantity: number; weightGrams?: number };

export function computeCartWeightGrams(items: ShippingLineItem[]) {
  return items.reduce((sum, item) => sum + (item.weightGrams ?? 500) * item.quantity, 0);
}

export function normalizeShippingMethod(method: {
  _id: unknown;
  code?: string;
  name?: string;
  baseCost?: number;
  costPerKg?: number;
  estimatedDays?: number;
  cityOnly?: boolean;
  freeAboveAmount?: number;
  allowShippingOnDelivery?: boolean;
  isActive?: boolean;
}) {
  const code = (method.code || 'POST') as ShippingMethodCode;
  const fallback = FALLBACK_COSTS[code];
  return {
    ...method,
    code,
    name: method.name || fallback.name,
    baseCost: method.baseCost ?? fallback.baseCost,
    costPerKg: method.costPerKg ?? fallback.costPerKg,
    estimatedDays: method.estimatedDays ?? fallback.estimatedDays,
    allowShippingOnDelivery:
      method.allowShippingOnDelivery ?? DEFAULT_SHIPPING_ON_DELIVERY[code] ?? fallback.allowShippingOnDelivery,
    freeAboveAmount: method.freeAboveAmount ?? 0,
    cityOnly: method.cityOnly ?? false,
    isActive: method.isActive ?? true
  };
}

export async function getActiveShippingMethods() {
  const methods = await ShippingMethod.find({ isActive: true }).sort({ baseCost: 1 }).lean();
  if (methods.length) return methods.map((m) => normalizeShippingMethod(m));
  return SHIPPING_METHOD_CODES.map((code) =>
    normalizeShippingMethod({ _id: code, code, ...FALLBACK_COSTS[code] })
  );
}

export async function resolveShippingMethod(shippingMethodId?: string, code?: string) {
  if (shippingMethodId && mongoose.isValidObjectId(shippingMethodId)) {
    const byId = await ShippingMethod.findById(shippingMethodId);
    if (byId?.isActive) return normalizeShippingMethod(byId.toObject());
  }

  const lookupCode = (code || shippingMethodId) as ShippingMethodCode | undefined;
  if (lookupCode) {
    const byCode = await ShippingMethod.findOne({ code: lookupCode, isActive: true });
    if (byCode) return normalizeShippingMethod(byCode.toObject());
    if (SHIPPING_METHOD_CODES.includes(lookupCode)) {
      return normalizeShippingMethod({ _id: lookupCode, code: lookupCode, ...FALLBACK_COSTS[lookupCode] });
    }
  }

  throw new Error('روش ارسال نامعتبر است');
}

export function computeShippingAmount(
  method: { code?: string; baseCost?: number; freeAboveAmount?: number; costPerKg?: number },
  subtotal: number,
  totalWeightGrams: number
) {
  if (method.freeAboveAmount && subtotal >= method.freeAboveAmount) return 0;

  let cost = method.baseCost ?? 0;
  if (method.code === 'POST') {
    const weightKg = totalWeightGrams / 1000;
    const perKg = method.costPerKg ?? 0;
    if (perKg > 0 && weightKg > 0) {
      cost += Math.ceil(weightKg) * perKg;
    }
  }
  return Math.round(cost);
}

/** پست در فاکتور؛ روش‌هایی مثل تیپاکس هزینه‌شان توسط مشتری مستقیم به پیک پرداخت می‌شود */
export function resolveShippingPaymentTiming(
  method: { code?: string; allowShippingOnDelivery?: boolean }
): ShippingPaymentTiming {
  if (method.allowShippingOnDelivery && method.code !== 'POST') return 'ON_DELIVERY';
  return 'ONLINE';
}

export function isCourierPaidShipping(method: { code?: string; allowShippingOnDelivery?: boolean }) {
  return Boolean(method.allowShippingOnDelivery && method.code !== 'POST');
}

export function splitShippingPayment(shippingCost: number, shippingPaymentTiming: ShippingPaymentTiming) {
  if (shippingPaymentTiming === 'ON_DELIVERY') {
    return { shippingPayableNow: 0, shippingDueOnDelivery: shippingCost };
  }
  return { shippingPayableNow: shippingCost, shippingDueOnDelivery: 0 };
}

export function shippingMethodObjectId(method: { _id: unknown }) {
  return mongoose.isValidObjectId(method._id) ? method._id : undefined;
}
