import { Coupon, CouponUsage } from '@/models';
import type { ShippingMethodCode } from '@/constants/shipping';

export const computeShippingCost = ({ method, city, province, weight, subtotal }: { method: ShippingMethodCode; city: string; province: string; weight: number; subtotal: number }) => {
  if (method === 'PICKUP') return 0;
  if (method === 'FREE_OVER_THRESHOLD' && subtotal >= 1500000) return 0;
  if (method === 'CITY_COURIER') return city ? 70000 : 90000;
  if (method === 'HEAVY_FREIGHT') return Math.max(220000, weight * 30000);
  if (method === 'TIPAX') return 120000 + weight * 15000;
  const provinceCoef = province ? 1.1 : 1;
  return Math.round((90000 + weight * 12000) * provinceCoef);
};

export const validateAndComputeCoupon = async ({ code, userId, subtotal, productIds, categoryIds, shippingCost }: { code?: string; userId: string; subtotal: number; productIds: string[]; categoryIds: string[]; shippingCost: number }) => {
  if (!code) return { coupon: null, discount: 0, freeShipping: false };
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new Error('کد تخفیف نامعتبر است.');
  const now = new Date();
  if (now < coupon.startsAt || now > coupon.expiresAt) throw new Error('کد تخفیف منقضی یا غیرفعال است.');
  if (subtotal < coupon.minPurchaseAmount) throw new Error('حداقل مبلغ سفارش برای این کد رعایت نشده است.');
  if (coupon.allowedProducts?.length && !coupon.allowedProducts.some((id: any) => productIds.includes(String(id)))) throw new Error('کد برای این محصول قابل استفاده نیست.');
  if (coupon.allowedCategories?.length && !coupon.allowedCategories.some((id: any) => categoryIds.includes(String(id)))) throw new Error('کد برای این دسته‌بندی قابل استفاده نیست.');
  const totalUsage = await CouponUsage.countDocuments({ coupon: coupon._id });
  if (coupon.usageLimit > 0 && totalUsage >= coupon.usageLimit) throw new Error('ظرفیت استفاده از کد به پایان رسیده است.');
  const userUsage = await CouponUsage.countDocuments({ coupon: coupon._id, user: userId });
  if (userUsage >= coupon.usagePerUserLimit) throw new Error('سقف استفاده شما از این کد تکمیل شده است.');

  if (coupon.discountType === 'FREE_SHIPPING') return { coupon, discount: shippingCost, freeShipping: true };
  if (coupon.discountType === 'FIXED') return { coupon, discount: Math.min(coupon.value, subtotal), freeShipping: false };
  const raw = Math.floor((subtotal * coupon.value) / 100);
  const discount = coupon.maxDiscountAmount ? Math.min(raw, coupon.maxDiscountAmount) : raw;
  return { coupon, discount, freeShipping: false };
};
