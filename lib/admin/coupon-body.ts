export function normalizeCouponBody(b: Record<string, unknown>) {
  return {
    code: b.code ? String(b.code).trim().toUpperCase() : undefined,
    title: String(b.title || '').trim(),
    description: String(b.description || '').trim(),
    discountType: b.discountType,
    value: b.discountType === 'FREE_SHIPPING' ? 0 : Number(b.value || 0),
    minPurchaseAmount: Number(b.minPurchaseAmount || 0),
    maxDiscountAmount: b.maxDiscountAmount ? Number(b.maxDiscountAmount) : undefined,
    startsAt: b.startsAt ? new Date(String(b.startsAt)) : undefined,
    expiresAt: b.expiresAt ? new Date(String(b.expiresAt)) : undefined,
    usageLimit: Number(b.usageLimit || 0),
    usagePerUserLimit: Number(b.usagePerUserLimit || 1),
    allowedProducts: Array.isArray(b.allowedProducts) ? b.allowedProducts.filter(Boolean) : [],
    allowedCategories: Array.isArray(b.allowedCategories) ? b.allowedCategories.filter(Boolean) : [],
    isActive: b.isActive ?? true
  };
}
