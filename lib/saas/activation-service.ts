import type { ClientSession } from 'mongoose';
import { Cart, CouponUsage, InventoryLog, Order, Product } from '@/models';
import type { InvoiceType } from '@/constants/invoice';
import { notifyOrderStatus } from '@/lib/finance/notification-service';

type InvoiceContext = {
  userId: string;
  invoiceNumber: string;
  invoiceId: string;
  relatedEntity?: { type: string; id: string };
};

async function decrementItemStock(
  item: { product: unknown; variantId?: unknown; quantity: number },
  reason: string,
  performedBy: string,
  session?: ClientSession
) {
  const productId = item.product;
  const variantId = item.variantId ? String(item.variantId) : '';

  if (variantId) {
    await Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $inc: { 'variants.$.stock': -item.quantity, stock: -item.quantity } },
      session ? { session } : undefined
    );
  } else {
    await Product.updateOne(
      { _id: productId },
      { $inc: { stock: -item.quantity } },
      session ? { session } : undefined
    );
  }

  await InventoryLog.create(
    [{ product: productId, change: -item.quantity, reason, performedBy }],
    session ? { session } : undefined
  );
}

export async function activateAfterPayment(
  invoiceType: InvoiceType,
  ctx: InvoiceContext,
  session?: ClientSession
) {
  switch (invoiceType) {
    case 'order':
      return activateOrder(ctx, session);
    case 'wallet_topup':
      return { activated: true, type: 'wallet_topup' };
    default:
      return { activated: false };
  }
}

async function recordCouponUsage(order: { _id: unknown; coupon?: unknown }, userId: string, session?: ClientSession) {
  if (!order.coupon) return;
  const exists = await CouponUsage.findOne({ order: order._id }).session(session ?? null);
  if (exists) return;
  await CouponUsage.create(
    [{ coupon: order.coupon, user: userId, order: order._id }],
    session ? { session } : undefined
  );
}

async function activateOrder(ctx: InvoiceContext, session?: ClientSession) {
  const orderId = ctx.relatedEntity?.id;
  if (!orderId) throw new Error('شناسه سفارش یافت نشد');
  const order = await Order.findById(orderId).session(session ?? null);
  if (!order) throw new Error('سفارش یافت نشد');

  for (const item of order.items) {
    await decrementItemStock(item, 'ORDER_PAID', ctx.userId, session);
  }

  await recordCouponUsage(order, ctx.userId, session);

  order.paymentStatus = 'PAID';
  order.orderStatus = 'PAID';
  await order.save(session ? { session } : undefined);
  await Cart.updateOne({ user: ctx.userId }, { $set: { items: [] } }, session ? { session } : undefined);
  await notifyOrderStatus(ctx.userId, String(order._id), 'PAID');
  return { activated: true, type: 'order', orderId: String(order._id) };
}

export async function activateCodOrder(orderId: string, userId: string, session?: ClientSession) {
  const order = await Order.findById(orderId).session(session ?? null);
  if (!order) throw new Error('سفارش یافت نشد');

  for (const item of order.items) {
    await decrementItemStock(item, 'ORDER_COD', userId, session);
  }

  await recordCouponUsage(order, userId, session);

  order.orderStatus = 'PROCESSING';
  order.paymentStatus = 'PENDING';
  await order.save({ session: session ?? undefined });
  await Cart.updateOne({ user: userId }, { $set: { items: [] } }, { session: session ?? undefined });
  await notifyOrderStatus(userId, String(order._id), 'PROCESSING');
  return order;
}
