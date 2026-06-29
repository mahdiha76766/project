export const SMS_SETTINGS_KEY = 'sms_config';

export type SmsEventKey =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELED'
  | 'PAYMENT_FAILED'
  | 'OTP_LOGIN'
  | 'OTP_REGISTER';

export type SmsEventConfig = {
  enabled: boolean;
  /** برای OTP: templateId سامانه verify — برای سایر: متن آزاد bulk */
  mode: 'verify' | 'bulk';
  templateId: number;
  /** پارامتر قالب verify (مثلاً Code) */
  verifyParamName: string;
  /** متن bulk — متغیرها: {name} {mobile} {orderId} {status} {tracking} {coupon} {code} {amount} */
  messageTemplate: string;
};

export type SmsSettings = {
  enabled: boolean;
  useSandbox: boolean;
  apiKey: string;
  sandboxApiKey: string;
  lineNumber: string;
  otpLength: number;
  otpExpireMinutes: number;
  otpResendSeconds: number;
  otpMaxAttempts: number;
  allowPasswordLogin: boolean;
  events: Record<SmsEventKey, SmsEventConfig>;
};

const defaultEvent = (overrides: Partial<SmsEventConfig>): SmsEventConfig => ({
  enabled: false,
  mode: 'bulk',
  templateId: 0,
  verifyParamName: 'Code',
  messageTemplate: '',
  ...overrides
});

export const defaultSmsSettings: SmsSettings = {
  enabled: false,
  useSandbox: true,
  apiKey: '',
  sandboxApiKey: '',
  lineNumber: '',
  otpLength: 5,
  otpExpireMinutes: 5,
  otpResendSeconds: 60,
  otpMaxAttempts: 5,
  allowPasswordLogin: true,
  events: {
    OTP_LOGIN: defaultEvent({
      enabled: true,
      mode: 'verify',
      templateId: 123456,
      verifyParamName: 'Code',
      messageTemplate: 'کد ورود: {code}'
    }),
    OTP_REGISTER: defaultEvent({
      enabled: true,
      mode: 'verify',
      templateId: 123456,
      verifyParamName: 'Code',
      messageTemplate: 'کد ثبت‌نام: {code}'
    }),
    ORDER_CREATED: defaultEvent({
      enabled: false,
      messageTemplate: '{name} عزیز، سفارش #{orderId} ثبت شد. مبلغ: {amount} ریال — نابسرا'
    }),
    ORDER_PAID: defaultEvent({
      enabled: false,
      messageTemplate: 'پرداخت سفارش #{orderId} با موفقیت انجام شد. — نابسرا'
    }),
    ORDER_PROCESSING: defaultEvent({
      enabled: false,
      messageTemplate: 'سفارش #{orderId} در حال آماده‌سازی است. — نابسرا'
    }),
    ORDER_SHIPPED: defaultEvent({
      enabled: false,
      messageTemplate: 'سفارش #{orderId} ارسال شد. کد رهگیری: {tracking} — نابسرا'
    }),
    ORDER_DELIVERED: defaultEvent({
      enabled: false,
      messageTemplate: 'سفارش #{orderId} تحویل شد. از خرید شما سپاسگزاریم. — نابسرا'
    }),
    ORDER_CANCELED: defaultEvent({
      enabled: false,
      messageTemplate: 'سفارش #{orderId} لغو شد. — نابسرا'
    }),
    PAYMENT_FAILED: defaultEvent({
      enabled: false,
      messageTemplate: 'پرداخت سفارش #{orderId} ناموفق بود. لطفاً دوباره تلاش کنید.'
    })
  }
};

export const SMS_EVENT_LABELS: Record<SmsEventKey, string> = {
  OTP_LOGIN: 'کد تأیید ورود',
  OTP_REGISTER: 'کد تأیید ثبت‌نام',
  ORDER_CREATED: 'ثبت سفارش جدید',
  ORDER_PAID: 'پرداخت موفق سفارش',
  ORDER_PROCESSING: 'در حال پردازش',
  ORDER_SHIPPED: 'ارسال سفارش',
  ORDER_DELIVERED: 'تحویل سفارش',
  ORDER_CANCELED: 'لغو سفارش',
  PAYMENT_FAILED: 'پرداخت ناموفق'
};

function asBool(v: unknown, fallback: boolean) {
  return typeof v === 'boolean' ? v : fallback;
}

function asNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asStr(v: unknown, fallback: string) {
  return typeof v === 'string' ? v : fallback;
}

function normalizeEvent(raw: unknown, fallback: SmsEventConfig): SmsEventConfig {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<SmsEventConfig>;
  return {
    enabled: asBool(r.enabled, fallback.enabled),
    mode: r.mode === 'verify' ? 'verify' : 'bulk',
    templateId: asNum(r.templateId, fallback.templateId),
    verifyParamName: asStr(r.verifyParamName, fallback.verifyParamName) || 'Code',
    messageTemplate: asStr(r.messageTemplate, fallback.messageTemplate)
  };
}

export function normalizeSmsSettings(raw: unknown): SmsSettings {
  const base = defaultSmsSettings;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<SmsSettings>;
  const events = { ...base.events };
  if (r.events && typeof r.events === 'object') {
    for (const key of Object.keys(base.events) as SmsEventKey[]) {
      events[key] = normalizeEvent((r.events as Record<string, unknown>)[key], base.events[key]);
    }
  }
  return {
    enabled: asBool(r.enabled, base.enabled),
    useSandbox: asBool(r.useSandbox, base.useSandbox),
    apiKey: asStr(r.apiKey, base.apiKey),
    sandboxApiKey: asStr(r.sandboxApiKey, base.sandboxApiKey),
    lineNumber: asStr(r.lineNumber, base.lineNumber),
    otpLength: Math.min(8, Math.max(4, asNum(r.otpLength, base.otpLength))),
    otpExpireMinutes: Math.min(30, Math.max(1, asNum(r.otpExpireMinutes, base.otpExpireMinutes))),
    otpResendSeconds: Math.min(300, Math.max(30, asNum(r.otpResendSeconds, base.otpResendSeconds))),
    otpMaxAttempts: Math.min(10, Math.max(3, asNum(r.otpMaxAttempts, base.otpMaxAttempts))),
    allowPasswordLogin: asBool(r.allowPasswordLogin, base.allowPasswordLogin),
    events
  };
}

export function renderSmsTemplate(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val === undefined || val === null ? '' : String(val);
  });
}
