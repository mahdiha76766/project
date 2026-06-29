import 'server-only';

import { SmsLog } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSmsSettings, getActiveApiKey, renderSmsTemplate } from '@/lib/admin/sms-settings';
import type { SmsEventKey } from '@/lib/admin/sms-settings-config';
import { SmsIrClient, toSmsIrMobile } from '@/lib/sms/smsir-client';
import { normalizeMobile } from '@/lib/validation/mobile';

type SendMeta = {
  sentBy?: string;
  orderId?: string;
  userId?: string;
  [key: string]: unknown;
};

async function writeLog(entry: {
  mobile: string;
  message: string;
  eventKey?: string;
  sendType: 'verify' | 'bulk' | 'manual';
  status: 'pending' | 'sent' | 'failed';
  providerStatus?: number;
  providerMessage?: string;
  messageId?: number;
  packId?: string;
  cost?: number;
  meta?: SendMeta;
  sentBy?: string;
}) {
  await connectToDatabase();
  await SmsLog.create({
    mobile: entry.mobile,
    message: entry.message,
    eventKey: entry.eventKey || '',
    sendType: entry.sendType,
    status: entry.status,
    providerStatus: entry.providerStatus,
    providerMessage: entry.providerMessage || '',
    messageId: entry.messageId,
    packId: entry.packId || '',
    cost: entry.cost,
    meta: entry.meta,
    sentBy: entry.sentBy
  });
}

function resolveClient(settings: Awaited<ReturnType<typeof getSmsSettings>>) {
  const apiKey = getActiveApiKey(settings);
  if (!apiKey) return null;
  return new SmsIrClient(apiKey);
}

export async function sendEventSms(
  eventKey: SmsEventKey,
  mobile: string,
  vars: Record<string, string | number | undefined> = {},
  meta?: SendMeta
) {
  const settings = await getSmsSettings();
  const normalized = normalizeMobile(mobile);

  if (!settings.enabled) {
    return { ok: false, error: 'سرویس پیامک غیرفعال است' };
  }

  const event = settings.events[eventKey];
  if (!event?.enabled) {
    return { ok: false, error: 'این رویداد پیامکی غیرفعال است', skipped: true };
  }

  const client = resolveClient(settings);
  if (!client) {
    return { ok: false, error: 'کلید API پیامک تنظیم نشده است' };
  }

  const smsMobile = toSmsIrMobile(normalized);

  try {
    if (event.mode === 'verify') {
      const code = String(vars.code || '');
      const res = await client.sendVerify({
        mobile: smsMobile,
        templateId: event.templateId,
        parameters: [{ name: event.verifyParamName || 'Code', value: code.slice(0, 25) }]
      });

      const ok = res.status === 1;
      await writeLog({
        mobile: normalized,
        message: renderSmsTemplate(event.messageTemplate || 'کد: {code}', vars),
        eventKey,
        sendType: 'verify',
        status: ok ? 'sent' : 'failed',
        providerStatus: res.status,
        providerMessage: res.message,
        messageId: ok ? res.data?.messageId : undefined,
        cost: ok ? res.data?.cost : undefined,
        meta,
        sentBy: meta?.sentBy
      });

      return ok
        ? { ok: true, messageId: res.data?.messageId, cost: res.data?.cost }
        : { ok: false, error: res.message || 'ارسال verify ناموفق بود' };
    }

    const text = renderSmsTemplate(event.messageTemplate, vars);
    if (!text.trim()) return { ok: false, error: 'متن پیامک خالی است' };
    if (!settings.lineNumber) return { ok: false, error: 'شماره خط پیامک تنظیم نشده است' };

    const res = await client.sendBulk({
      lineNumber: settings.lineNumber,
      messageText: text,
      mobiles: [normalized.startsWith('0') ? normalized : `0${smsMobile}`]
    });

    const ok = res.status === 1;
    await writeLog({
      mobile: normalized,
      message: text,
      eventKey,
      sendType: 'bulk',
      status: ok ? 'sent' : 'failed',
      providerStatus: res.status,
      providerMessage: res.message,
      messageId: ok ? res.data?.messageIds?.[0] : undefined,
      packId: ok ? res.data?.packId : undefined,
      cost: ok ? res.data?.cost : undefined,
      meta,
      sentBy: meta?.sentBy
    });

    return ok
      ? { ok: true, packId: res.data?.packId, cost: res.data?.cost }
      : { ok: false, error: res.message || 'ارسال bulk ناموفق بود' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطای ارسال پیامک';
    await writeLog({
      mobile: normalized,
      message: event.messageTemplate,
      eventKey,
      sendType: event.mode === 'verify' ? 'verify' : 'bulk',
      status: 'failed',
      providerMessage: msg,
      meta,
      sentBy: meta?.sentBy
    });
    return { ok: false, error: msg };
  }
}

export async function sendManualSms(params: {
  mobiles: string[];
  message: string;
  sentBy?: string;
  meta?: SendMeta;
}) {
  const settings = await getSmsSettings();
  if (!settings.enabled) return { ok: false, error: 'سرویس پیامک غیرفعال است' };
  if (!settings.lineNumber) return { ok: false, error: 'شماره خط پیامک تنظیم نشده است' };

  const client = resolveClient(settings);
  if (!client) return { ok: false, error: 'کلید API پیامک تنظیم نشده است' };

  const unique = [...new Set(params.mobiles.map(normalizeMobile))].filter(Boolean);
  if (!unique.length) return { ok: false, error: 'شماره موبایل معتبر نیست' };
  if (unique.length > 100) return { ok: false, error: 'حداکثر ۱۰۰ شماره در هر ارسال' };

  const text = params.message.trim();
  if (!text) return { ok: false, error: 'متن پیامک خالی است' };

  try {
    const res = await client.sendBulk({
      lineNumber: settings.lineNumber,
      messageText: text,
      mobiles: unique
    });

    const ok = res.status === 1;
    for (let i = 0; i < unique.length; i++) {
      await writeLog({
        mobile: unique[i],
        message: text,
        sendType: 'manual',
        status: ok ? 'sent' : 'failed',
        providerStatus: res.status,
        providerMessage: res.message,
        messageId: ok ? res.data?.messageIds?.[i] : undefined,
        packId: ok ? res.data?.packId : undefined,
        cost: ok && res.data?.cost ? res.data.cost / unique.length : undefined,
        meta: params.meta,
        sentBy: params.sentBy
      });
    }

    return ok
      ? { ok: true, packId: res.data?.packId, sent: unique.length, cost: res.data?.cost }
      : { ok: false, error: res.message || 'ارسال ناموفق بود' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'خطای ارسال' };
  }
}

export async function sendBulkCouponSms(params: {
  mobiles: string[];
  couponCode: string;
  messageTemplate?: string;
  sentBy?: string;
}) {
  const template =
    params.messageTemplate ||
    'کد تخفیف ویژه شما: {coupon} — نابسرا';
  const message = renderSmsTemplate(template, { coupon: params.couponCode });
  return sendManualSms({ mobiles: params.mobiles, message, sentBy: params.sentBy, meta: { coupon: params.couponCode } });
}

export async function getSmsCredit() {
  const settings = await getSmsSettings();
  const client = resolveClient(settings);
  if (!client) return { ok: false, error: 'کلید API تنظیم نشده' };
  const res = await client.getCredit();
  return res.status === 1 ? { ok: true, credit: res.data } : { ok: false, error: res.message };
}

export async function getSmsLines() {
  const settings = await getSmsSettings();
  const client = resolveClient(settings);
  if (!client) return { ok: false, error: 'کلید API تنظیم نشده' };
  const res = await client.getLines();
  return res.status === 1 ? { ok: true, lines: res.data } : { ok: false, error: res.message };
}

export function orderStatusToSmsEvent(status: string): SmsEventKey | null {
  const map: Record<string, SmsEventKey> = {
    PENDING_PAYMENT: 'ORDER_CREATED',
    PAID: 'ORDER_PAID',
    PROCESSING: 'ORDER_PROCESSING',
    SHIPPED: 'ORDER_SHIPPED',
    DELIVERED: 'ORDER_DELIVERED',
    CANCELED: 'ORDER_CANCELED'
  };
  return map[status] || null;
}

export async function sendOrderSms(params: {
  userId: string;
  orderId: string;
  eventKey: SmsEventKey;
  mobile?: string;
  name?: string;
  amount?: number;
  tracking?: string;
  coupon?: string;
  status?: string;
}) {
  let mobile = params.mobile;
  let name = params.name;
  if (!mobile) {
    const { User } = await import('@/models');
    await connectToDatabase();
    const user = await User.findById(params.userId).select('mobile name').lean() as { mobile?: string; name?: string } | null;
    mobile = user?.mobile;
    name = name || user?.name;
  }
  if (!mobile) return { ok: false, error: 'موبایل کاربر یافت نشد' };

  const shortOrder = params.orderId.slice(-8);
  return sendEventSms(params.eventKey, mobile, {
    name: name || '',
    mobile,
    orderId: shortOrder,
    status: params.status || '',
    tracking: params.tracking || '',
    coupon: params.coupon || '',
    amount: params.amount ? params.amount.toLocaleString('fa-IR') : ''
  }, { orderId: params.orderId, userId: params.userId });
}

export async function sendOrderStatusSms(params: {
  userId: string;
  orderId: string;
  status: string;
  mobile?: string;
  name?: string;
  amount?: number;
  tracking?: string;
}) {
  const eventKey = orderStatusToSmsEvent(params.status);
  if (!eventKey || eventKey === 'ORDER_CREATED') return { ok: false, skipped: true };
  return sendOrderSms({ ...params, eventKey, status: params.status });
}

export async function notifyPaymentFailedSms(params: {
  userId: string;
  orderId: string;
  mobile?: string;
  name?: string;
}) {
  const settings = await getSmsSettings();
  const event = settings.events.PAYMENT_FAILED;
  if (!event.enabled) return { ok: false, skipped: true };

  let mobile = params.mobile;
  let name = params.name;
  if (!mobile) {
    const { User } = await import('@/models');
    await connectToDatabase();
    const user = await User.findById(params.userId).select('mobile name').lean() as { mobile?: string; name?: string } | null;
    mobile = user?.mobile;
    name = user?.name;
  }
  if (!mobile) return { ok: false, error: 'موبایل یافت نشد' };

  return sendEventSms('PAYMENT_FAILED', mobile, {
    name: name || '',
    orderId: params.orderId.slice(-8)
  }, { orderId: params.orderId, userId: params.userId });
}
