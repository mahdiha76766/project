import { NextResponse } from 'next/server';
import { Cart, CouponUsage, InventoryLog, Order, Payment, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { computeShippingCost, validateAndComputeCoupon } from '@/lib/checkout/pricing';
import { sendOrderConfirmationSms } from '@/lib/sms/provider';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const body = await req.json();
  const cart = await Cart.findOne({ user: user.userId }).populate('items.product');
  if (!cart || !cart.items.length) return NextResponse.json({ error: 'سبد خرید خالی است' }, { status: 400 });

  const items = cart.items.map((i: any) => ({ product: i.product._id, quantity: i.quantity, price: i.product.discountPrice || i.product.price, weight: i.weight, volume: i.volume }));
  const subtotal = items.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0);
  const totalWeight = items.reduce((acc: number, i: any) => acc + (i.quantity * 1), 0);
  const shippingCost = computeShippingCost({ method: body.shippingMethod, city: body.address.city, province: body.address.province, weight: totalWeight, subtotal });
  const couponResult = await validateAndComputeCoupon({ code: body.couponCode, userId: user.userId, subtotal, productIds: items.map((i: any) => String(i.product)), categoryIds: [], shippingCost });
  const total = subtotal + shippingCost - couponResult.discount;

  const order = await Order.create({ user: user.userId, items, shippingAddress: body.address, subtotalAmount: subtotal, shippingAmount: shippingCost, discountAmount: couponResult.discount, totalAmount: Math.max(total, 0), paymentMethod: body.paymentProvider });
  const payment = await Payment.create({ order: order._id, amount: order.totalAmount, provider: body.paymentProvider, status: 'PENDING', authority: `AUTH-${Date.now()}` });

  for (const item of items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    await InventoryLog.create({ product: item.product, change: -item.quantity, reason: 'ORDER_PLACED', performedBy: user.userId });
  }
  if (couponResult.coupon) {
    await CouponUsage.create({ coupon: couponResult.coupon._id, user: user.userId, order: order._id });
  }

  await Cart.updateOne({ user: user.userId }, { $set: { items: [] } });
  await sendOrderConfirmationSms(user.mobile, String(order._id));

  return NextResponse.json({ orderId: order._id, paymentId: payment._id, redirectUrl: `/payment/result?orderId=${order._id}&status=pending` });
}
