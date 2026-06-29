import { Notification } from '@/models';
import { ORDER_STATUS_LABELS } from '@/lib/admin/labels';
import { resolveUserId } from '@/lib/utils/resolve-user-id';
import { sendOrderStatusSms, sendOrderSms, notifyPaymentFailedSms } from '@/lib/sms/sms-service';

export async function notifyUser(userId: string, title: string, message: string) {
  const id = resolveUserId(userId);
  if (!id) return;
  await Notification.create({ user: id, title, message, isRead: false });
}

export async function notifyPaymentStatus(userId: string, status: string, invoiceNumber: string) {
  const title = status === 'PAID' ? 'پرداخت موفق' : 'وضعیت پرداخت';
  const message =
    status === 'PAID'
      ? `پرداخت فاکتور ${invoiceNumber} با موفقیت انجام شد.`
      : `وضعیت پرداخت فاکتور ${invoiceNumber}: ${status}`;
  await notifyUser(userId, title, message);
}

export async function notifyWalletTransaction(userId: string, type: string, amount: number) {
  await notifyUser(userId, 'تراکنش کیف پول', `تراکنش ${type} به مبلغ ${amount.toLocaleString('fa-IR')} ریال ثبت شد.`);
}

export async function notifyOrderStatus(
  userId: string,
  orderId: string,
  status: string,
  extra?: { tracking?: string; amount?: number; mobile?: string; name?: string }
) {
  const id = resolveUserId(userId);
  if (!id) return;

  const label = ORDER_STATUS_LABELS[status] || status;
  const shortOrder = orderId.slice(-8);
  await notifyUser(id, 'به‌روزرسانی سفارش', `وضعیت سفارش #${shortOrder} به «${label}» تغییر کرد.`);

  void sendOrderStatusSms({
    userId: id,
    orderId,
    status,
    tracking: extra?.tracking,
    amount: extra?.amount,
    mobile: extra?.mobile,
    name: extra?.name
  }).catch(() => undefined);
}

export async function notifyOrderCreated(
  userId: string,
  orderId: string,
  extra?: { amount?: number; mobile?: string; name?: string }
) {
  void sendOrderSms({
    userId: resolveUserId(userId) || userId,
    orderId,
    eventKey: 'ORDER_CREATED',
    amount: extra?.amount,
    mobile: extra?.mobile,
    name: extra?.name,
    status: 'PENDING_PAYMENT'
  }).catch(() => undefined);
}

export async function notifyPaymentFailed(
  userId: string,
  orderId: string,
  extra?: { mobile?: string; name?: string }
) {
  const id = resolveUserId(userId);
  if (!id) return;
  await notifyUser(id, 'پرداخت ناموفق', `پرداخت سفارش #${orderId.slice(-8)} ناموفق بود.`);
  void notifyPaymentFailedSms({ userId: id, orderId, ...extra }).catch(() => undefined);
}
