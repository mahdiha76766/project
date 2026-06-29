import { Coupon, CouponUsage, Order } from '@/models';
import {
  computeCartWeightGrams,
  computeShippingAmount,
  isCourierPaidShipping,
  resolveShippingMethod,
  resolveShippingPaymentTiming,
  splitShippingPayment,
  type ShippingLineItem
} from '@/lib/checkout/shipping';

async function countCouponUsage(couponId: unknown, userId?: string) {
  const couponFilter = { coupon: couponId };
  const usageCount = await CouponUsage.countDocuments(couponFilter);
  const pendingFilter: Record<string, unknown> = {
    coupon: couponId,
    orderStatus: 'PENDING_PAYMENT'
  };
  if (userId) pendingFilter.user = userId;
  const pendingCount = await Order.countDocuments(pendingFilter);
  return { usageCount, pendingCount, total: usageCount + pendingCount };
}

export const validateAndComputeCoupon = async ({
  code,
  userId,
  subtotal,
  productIds,
  categoryIds,
  shippingCost,
  shippingDueOnDelivery = 0
}: {
  code?: string;
  userId: string;
  subtotal: number;
  productIds: string[];
  categoryIds: string[];
  shippingCost: number;
  shippingDueOnDelivery?: number;
}) => {
  if (!code?.trim()) return { coupon: null, discount: 0, freeShipping: false, couponLabel: '' };

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!coupon) throw new Error('کد تخفیف نامعتبر است.');

  const now = new Date();
  if (now < coupon.startsAt || now > coupon.expiresAt) throw new Error('کد تخفیف منقضی یا غیرفعال است.');
  if (subtotal < coupon.minPurchaseAmount) {
    throw new Error(`حداقل مبلغ سفارش برای این کد ${coupon.minPurchaseAmount.toLocaleString('fa-IR')} ریال است.`);
  }

  if (coupon.allowedProducts?.length) {
    const allowed = coupon.allowedProducts.map(String);
    if (!productIds.some((id) => allowed.includes(id))) {
      throw new Error('این کد برای محصولات سبد شما قابل استفاده نیست.');
    }
  }
  if (coupon.allowedCategories?.length) {
    const allowed = coupon.allowedCategories.map(String);
    if (!categoryIds.some((id) => allowed.includes(id))) {
      throw new Error('این کد برای دسته‌بندی محصولات سبد شما قابل استفاده نیست.');
    }
  }

  const globalUsage = await countCouponUsage(coupon._id);
  if (coupon.usageLimit > 0 && globalUsage.total >= coupon.usageLimit) {
    throw new Error('ظرفیت استفاده از این کد به پایان رسیده است.');
  }

  const userUsage = await countCouponUsage(coupon._id, userId);
  if (userUsage.total >= coupon.usagePerUserLimit) {
    throw new Error('سقف استفاده شما از این کد تکمیل شده است.');
  }

  if (coupon.discountType === 'FREE_SHIPPING') {
    const fullShipping = shippingCost + shippingDueOnDelivery;
    if (fullShipping <= 0) throw new Error('این کد فقط برای سفارش‌های دارای هزینه ارسال قابل استفاده است.');
    return {
      coupon,
      discount: fullShipping,
      freeShipping: true,
      couponLabel: coupon.title || 'ارسال رایگان'
    };
  }

  if (coupon.discountType === 'FIXED') {
    return {
      coupon,
      discount: Math.min(coupon.value, subtotal),
      freeShipping: false,
      couponLabel: coupon.title || `تخفیف ${coupon.value.toLocaleString('fa-IR')} ریالی`
    };
  }

  const raw = Math.floor((subtotal * coupon.value) / 100);
  const discount = coupon.maxDiscountAmount ? Math.min(raw, coupon.maxDiscountAmount) : raw;
  return {
    coupon,
    discount,
    freeShipping: false,
    couponLabel: coupon.title || `تخفیف ${coupon.value}٪`
  };
};

export async function buildCheckoutQuote(body: {
  shippingMethodId?: string;
  shippingMethodCode?: string;
  couponCode?: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    categoryId?: string;
    weightGrams?: number;
  }>;
}) {
  const subtotal = body.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingLineItems: ShippingLineItem[] = body.items.map((i) => ({
    quantity: i.quantity,
    weightGrams: i.weightGrams
  }));
  const totalWeightGrams = computeCartWeightGrams(shippingLineItems);

  const shippingMethod = await resolveShippingMethod(body.shippingMethodId, body.shippingMethodCode);
  const courierPaid = isCourierPaidShipping(shippingMethod);
  const shippingCost = courierPaid
    ? computeShippingAmount(shippingMethod, subtotal, totalWeightGrams)
    : computeShippingAmount(shippingMethod, subtotal, totalWeightGrams);
  const shippingPaymentTiming = resolveShippingPaymentTiming(shippingMethod);
  let { shippingPayableNow, shippingDueOnDelivery } = splitShippingPayment(shippingCost, shippingPaymentTiming);

  const couponResult = await validateAndComputeCoupon({
    code: body.couponCode,
    userId: body.userId,
    subtotal,
    productIds: body.items.map((i) => i.productId),
    categoryIds: body.items.map((i) => i.categoryId).filter(Boolean) as string[],
    shippingCost: shippingPayableNow,
    shippingDueOnDelivery
  });

  let discount = couponResult.discount;
  if (couponResult.freeShipping) {
    shippingPayableNow = 0;
    shippingDueOnDelivery = 0;
    discount = couponResult.discount;
  }

  const total = Math.max(subtotal + shippingPayableNow - discount, 0);

  return {
    subtotal,
    shippingCost,
    shippingPayableNow,
    shippingDueOnDelivery,
    shippingPaymentTiming,
    totalWeightGrams,
    discount,
    total,
    shippingMethod,
    coupon: couponResult.coupon,
    freeShipping: couponResult.freeShipping,
    couponLabel: couponResult.couponLabel,
    courierPaidShipping: courierPaid && !couponResult.freeShipping
  };
}
