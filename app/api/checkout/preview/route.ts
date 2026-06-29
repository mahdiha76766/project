import { NextResponse } from 'next/server';
import { Cart } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { buildCheckoutQuote } from '@/lib/checkout/pricing';
import { findVariant, getVariantUnitPrice, getVariantWeightGrams } from '@/lib/product/variants';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const body = await req.json();
  const cart = await Cart.findOne({ user: user.userId }).populate('items.product');
  if (!cart?.items?.length) return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });

  const items = cart.items.map((i: {
    product: {
      _id: unknown;
      discountPrice?: number;
      price: number;
      category?: unknown;
      weight?: number;
      weightUnit?: string;
      variants?: unknown[];
    };
    variantId?: { toString: () => string } | string | null;
    quantity: number;
  }) => {
    const product = i.product as Parameters<typeof findVariant>[0];
    const variant = findVariant(product, i.variantId ? String(i.variantId) : undefined);
    return {
      productId: String(i.product._id),
      quantity: i.quantity,
      price: getVariantUnitPrice(variant!),
      categoryId: i.product.category ? String(i.product.category) : undefined,
      weightGrams: getVariantWeightGrams(variant!, product)
    };
  });

  try {
    const quote = await buildCheckoutQuote({
      shippingMethodId: body.shippingMethodId,
      shippingMethodCode: body.shippingMethodCode,
      couponCode: body.couponCode,
      userId: user.userId,
      items
    });
    return NextResponse.json({
      subtotal: quote.subtotal,
      shippingCost: quote.shippingCost,
      shippingPayableNow: quote.shippingPayableNow,
      shippingDueOnDelivery: quote.shippingDueOnDelivery,
      shippingPaymentTiming: quote.shippingPaymentTiming,
      totalWeightGrams: quote.totalWeightGrams,
      courierPaidShipping: quote.courierPaidShipping,
      discount: quote.discount,
      freeShipping: quote.freeShipping,
      couponLabel: quote.couponLabel,
      total: quote.total,
      shippingMethod: {
        id: String(quote.shippingMethod._id),
        code: quote.shippingMethod.code,
        name: quote.shippingMethod.name,
        costPerKg: quote.shippingMethod.costPerKg,
        baseCost: quote.shippingMethod.baseCost
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در محاسبه';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
