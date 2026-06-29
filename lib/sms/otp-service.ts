import 'server-only';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OtpCode, User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { normalizeMobile } from '@/lib/validation/mobile';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getSmsSettings } from '@/lib/admin/sms-settings';
import { sendEventSms } from '@/lib/sms/sms-service';
import type { SmsEventKey } from '@/lib/admin/sms-settings-config';

export type OtpPurpose = 'login' | 'register';

export type RegisterOtpPayload = {
  name: string;
  email: string;
  password?: string;
};

function generateOtp(length: number) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

export async function sendOtp(params: {
  mobile: string;
  purpose: OtpPurpose;
  ip: string;
  registerPayload?: RegisterOtpPayload;
}) {
  const mobile = normalizeMobile(params.mobile);
  const settings = await getSmsSettings();

  if (!settings.enabled) {
    return { ok: false as const, error: 'سرویس پیامک غیرفعال است' };
  }

  const eventKey: SmsEventKey = params.purpose === 'login' ? 'OTP_LOGIN' : 'OTP_REGISTER';
  const event = settings.events[eventKey];
  if (!event.enabled) {
    return { ok: false as const, error: 'ارسال کد تأیید برای این عملیات غیرفعال است' };
  }

  const rate = checkRateLimit(`otp:${params.ip}:${mobile}`, 5, 60_000);
  if (!rate.allowed) {
    return { ok: false as const, error: 'تعداد درخواست زیاد است، کمی بعد تلاش کنید' };
  }

  await connectToDatabase();

  if (params.purpose === 'login') {
    const user = await User.findOne({ mobile }).select('_id isBlocked');
    if (!user) return { ok: false as const, error: 'کاربری با این شماره یافت نشد' };
    if (user.isBlocked) return { ok: false as const, error: 'حساب کاربری مسدود شده است' };
  } else {
    const exists = await User.findOne({ mobile }).select('_id');
    if (exists) return { ok: false as const, error: 'این شماره قبلاً ثبت‌نام شده است' };
    if (params.registerPayload?.email) {
      const emailExists = await User.findOne({ email: params.registerPayload.email.toLowerCase() }).select('_id');
      if (emailExists) return { ok: false as const, error: 'ایمیل قبلاً استفاده شده است' };
    }
  }

  const existing = await OtpCode.findOne({ mobile, purpose: params.purpose, verified: false }).sort({ createdAt: -1 });
  if (existing) {
    const cooldownMs = settings.otpResendSeconds * 1000;
    const elapsed = Date.now() - new Date(existing.lastSentAt).getTime();
    if (elapsed < cooldownMs) {
      const wait = Math.ceil((cooldownMs - elapsed) / 1000);
      return { ok: false as const, error: `لطفاً ${wait} ثانیه دیگر تلاش کنید`, retryAfter: wait };
    }
  }

  const code = generateOtp(settings.otpLength);
  const codeHash = await bcrypt.hash(code, 8);
  const expiresAt = new Date(Date.now() + settings.otpExpireMinutes * 60_000);

  await OtpCode.create({
    mobile,
    codeHash,
    purpose: params.purpose,
    payload: params.registerPayload || null,
    attempts: 0,
    lastSentAt: new Date(),
    expiresAt,
    verified: false
  });

  const sms = await sendEventSms(eventKey, mobile, { code });
  if (!sms.ok) {
    return { ok: false as const, error: sms.error || 'ارسال پیامک ناموفق بود' };
  }

  return {
    ok: true as const,
    expiresIn: settings.otpExpireMinutes * 60,
    resendAfter: settings.otpResendSeconds,
    sandbox: settings.useSandbox
  };
}

export async function verifyOtp(params: { mobile: string; code: string; purpose: OtpPurpose }) {
  const mobile = normalizeMobile(params.mobile);
  const settings = await getSmsSettings();

  await connectToDatabase();

  const record = await OtpCode.findOne({ mobile, purpose: params.purpose, verified: false }).sort({ createdAt: -1 });
  if (!record) return { ok: false as const, error: 'کد تأیید یافت نشد. دوباره درخواست دهید.' };
  if (record.expiresAt < new Date()) return { ok: false as const, error: 'کد منقضی شده است' };

  if (record.attempts >= settings.otpMaxAttempts) {
    return { ok: false as const, error: 'تعداد تلاش بیش از حد مجاز است' };
  }

  const match = await bcrypt.compare(params.code.trim(), record.codeHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { ok: false as const, error: 'کد وارد شده نادرست است' };
  }

  record.verified = true;
  await record.save();

  return { ok: true as const, payload: record.payload as RegisterOtpPayload | null };
}

export async function getOtpConfig() {
  const settings = await getSmsSettings();
  return {
    enabled: settings.enabled,
    otpEnabled: settings.events.OTP_LOGIN.enabled || settings.events.OTP_REGISTER.enabled,
    allowPasswordLogin: settings.allowPasswordLogin,
    resendSeconds: settings.otpResendSeconds
  };
}
