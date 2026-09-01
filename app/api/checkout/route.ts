import { NextResponse } from 'next/server';
import { Cart, Order, Product, User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { buildCheckoutQuote } from '@/lib/checkout/pricing';
import { shippingMethodObjectId } from '@/lib/checkout/shipping';
import { createProforma } from '@/lib/invoice/invoice-service';
import { env } from '@/server/config/env';
import { activateCodOrder } from '@/lib/saas/activation-service';
import { findVariant, getVariantUnitPrice, getVariantWeightGrams, variantInStock } from '@/lib/product/variants';
import { notifyOrderCreated } from '@/lib/finance/notification-service';
import { assertSalesEnabled } from '@/lib/commerce/sales';

export async function POST(req: Request) {
  const sales = await assertSalesEnabled();
  if (sales.error) return sales.error;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const body = await req.json();
  const cart = await Cart.findOne({ user: user.userId }).populate('items.product');
  if (!cart || !cart.items.length) return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });

  for (const item of cart.items) {
    const product = item.product as InstanceType<typeof Product>;
    const variant = findVariant(product, item.variantId ? String(item.variantId) : undefined);
    if (!product || !variant || !variantInStock(variant, item.quantity)) {
      const label = variant?.name ? `${product?.name} (${variant.name})` : product?.name ?? '';
      return NextResponse.json({ error: `موجودی ${label} کافی نیست` }, { status: 400 });
    }
  }

  const checkoutItems = cart.items.map((i: {
    product: InstanceType<typeof Product>;
    variantId?: { toString: () => string } | string | null;
    quantity: number;
    weight?: string;
    volume?: string;
  }) => {
    const variant = findVariant(i.product, i.variantId ? String(i.variantId) : undefined)!;
    return {
      productId: String(i.product._id),
      quantity: i.quantity,
      price: getVariantUnitPrice(variant),
      categoryId: i.product.category ? String(i.product.category) : undefined,
      weightGrams: getVariantWeightGrams(variant, i.product),
      product: i.product,
      variant,
      variantId: i.variantId ? String(i.variantId) : undefined,
      weight: i.weight,
      volume: i.volume
    };
  });

  const quote = await buildCheckoutQuote({
    shippingMethodId: body.shippingMethodId,
    shippingMethodCode: body.shippingMethodCode,
    couponCode: body.couponCode,
    userId: user.userId,
    items: checkoutItems
  });

  const paymentTiming = body.paymentTiming === 'COD' ? 'COD' : 'ONLINE';
  const payMethod = body.payMethod ?? 'card_to_card';
  const orderPaymentMethod =
    paymentTiming === 'COD'
      ? 'COD'
      : payMethod === 'wallet'
        ? 'WALLET'
        : payMethod === 'mixed'
          ? 'MIXED'
          : payMethod === 'card_to_card'
            ? 'CARD_TO_CARD'
            : 'GATEWAY';

  const orderItems = checkoutItems.map((i: (typeof checkoutItems)[number]) => ({
    product: i.product._id,
    variantId: i.variantId || undefined,
    variantName: i.variant.name,
    sku: i.variant.sku || '',
    quantity: i.quantity,
    price: i.price,
    weight: i.weight,
    volume: i.volume
  }));

  const order = await Order.create({
    user: user.userId,
    items: orderItems,
    shippingAddress: body.address,
    shippingMethod: shippingMethodObjectId(quote.shippingMethod),
    shippingMethodCode: quote.shippingMethod.code,
    shippingMethodName: quote.shippingMethod.name,
    subtotalAmount: quote.subtotal,
    shippingAmount: quote.shippingCost,
    shippingPaymentTiming: quote.shippingPaymentTiming,
    shippingDueOnDelivery: quote.shippingDueOnDelivery,
    discountAmount: quote.discount,
    totalAmount: quote.total,
    coupon: quote.coupon?._id,
    couponCode: quote.coupon?.code || body.couponCode?.trim().toUpperCase() || '',
    paymentTiming,
    paymentMethod: orderPaymentMethod,
    orderStatus: paymentTiming === 'COD' ? 'PROCESSING' : 'PENDING_PAYMENT',
    paymentStatus: paymentTiming === 'COD' ? 'PENDING' : 'PENDING'
  });

  const dbUser = await User.findById(user.userId).lean() as { name?: string; mobile?: string; email?: string } | null;

  if (paymentTiming === 'COD') {
    await activateCodOrder(String(order._id), user.userId);
    void notifyOrderCreated(user.userId, String(order._id), {
      amount: quote.total,
      mobile: dbUser?.mobile,
      name: dbUser?.name
    });
    return NextResponse.json({
      orderId: order._id,
      paymentTiming: 'COD',
      redirectUrl: `/dashboard/orders/${order._id}`,
      message: 'سفارش با پرداخت در محل ثبت شد'
    });
  }

  const invoiceItems = cart.items.map((i: {
    product: InstanceType<typeof Product>;
    variantId?: { toString: () => string } | string | null;
    quantity: number;
  }) => {
    const variant = findVariant(i.product, i.variantId ? String(i.variantId) : undefined)!;
    const title = variant.name && i.product.variants?.length
      ? `${i.product.name} — ${variant.name}`
      : i.product.name;
    return {
      title,
      quantity: i.quantity,
      unitPrice: getVariantUnitPrice(variant),
      metadata: { productId: String(i.product._id), variantId: i.variantId ? String(i.variantId) : undefined }
    };
  });

  if (quote.shippingPayableNow > 0) {
    invoiceItems.push({
      title: `هزینه ارسال (${quote.shippingMethod.name})`,
      quantity: 1,
      unitPrice: quote.shippingPayableNow,
      metadata: { shippingMethodCode: quote.shippingMethod.code, totalWeightGrams: quote.totalWeightGrams }
    });
  }

  const invoice = await createProforma({
    userId: user.userId,
    type: 'order',
    items: invoiceItems,
    discountAmount: quote.discount,
    relatedEntity: { type: 'order', id: String(order._id) },
    buyerInfo: {
      name: dbUser?.name,
      mobile: dbUser?.mobile,
      email: dbUser?.email ?? undefined,
      address: body.address?.addressLine
    },
    expiresInMinutes: payMethod === 'card_to_card' ? 7 * 24 * 60 : env.ORDER_PAYMENT_TIMEOUT_MINUTES
  });

  order.invoiceNumber = invoice.invoiceNumber;
  await order.save();

  void notifyOrderCreated(user.userId, String(order._id), {
    amount: quote.total,
    mobile: dbUser?.mobile,
    name: dbUser?.name
  });

  return NextResponse.json({
    orderId: order._id,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    expiresAt: invoice.expiresAt,
    paymentTiming: 'ONLINE',
    payMethod
  });
}
