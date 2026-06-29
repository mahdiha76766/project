'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthAlert, AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isValidMobile, normalizeMobile } from '@/lib/validation/mobile';
import { MathCaptcha, type CaptchaValue } from '@/components/security/MathCaptcha';

type OtpConfig = {
  enabled: boolean;
  otpEnabled: boolean;
  resendSeconds: number;
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [countdown, setCountdown] = useState(0);
  const [config, setConfig] = useState<OtpConfig | null>(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', password: '', code: '' });
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: '', answer: '' });

  useEffect(() => {
    fetch('/api/auth/otp/send')
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    setError('');
    const payload = {
      name: formData.name.trim(),
      mobile: normalizeMobile(formData.mobile),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    if (payload.name.length < 2) {
      setError('نام را کامل وارد کنید');
      return;
    }
    if (!isValidMobile(payload.mobile)) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    if (!payload.email.includes('@')) {
      setError('ایمیل معتبر نیست');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        purpose: 'register',
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer
      })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'ارسال کد ناموفق بود');
      if (data.retryAfter) setCountdown(Number(data.retryAfter));
      return;
    }
    setFormData((f) => ({ ...f, mobile: payload.mobile, email: payload.email, name: payload.name }));
    setStep('code');
    setCountdown(data.resendAfter || 60);
  };

  const verifyAndRegister = async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        mobile: normalizeMobile(formData.mobile),
        code: formData.code,
        purpose: 'register'
      })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'ثبت‌نام ناموفق بود');
      return;
    }
    router.push(data.role === 'ADMIN' ? '/admin' : '/dashboard');
    router.refresh();
  };

  const legacyRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      name: formData.name.trim(),
      mobile: normalizeMobile(formData.mobile),
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };
    if (payload.password.length < 8) {
      setLoading(false);
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد');
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer
      })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'ثبت‌نام انجام نشد');
      return;
    }
    router.push(`/auth/login?mobile=${encodeURIComponent(data.mobile || payload.mobile)}`);
  };

  const otpEnabled = config?.otpEnabled ?? false;

  return (
    <AuthLayout
      variant="register"
      title="ساخت حساب جدید"
      description={otpEnabled ? 'پس از تکمیل فرم، کد تأیید برای شما ارسال می‌شود.' : 'اطلاعات خود را وارد کنید.'}
      footer={
        <>
          قبلاً ثبت‌نام کرده‌اید؟ <AuthLink href="/auth/login">وارد شوید</AuthLink>
        </>
      }
    >
      {otpEnabled && step === 'code' ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            کد تأیید به <span dir="ltr" className="font-bold">{formData.mobile}</span> ارسال شد
          </p>
          <Input
            name="code"
            label="کد تأیید"
            placeholder="۱۲۳۴۵"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            inputMode="numeric"
            ltr
            required
          />
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <Button type="button" fullWidth disabled={loading || formData.code.length < 4} onClick={verifyAndRegister}>
            {loading ? 'لطفاً صبر کنید...' : 'تأیید و ساخت حساب'}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-amber-700" onClick={() => setStep('form')}>
              ویرایش اطلاعات
            </button>
            <button type="button" className="text-slate-500 disabled:opacity-50" disabled={countdown > 0 || loading} onClick={sendCode}>
              {countdown > 0 ? `ارسال مجدد (${countdown})` : 'ارسال مجدد'}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (otpEnabled) void sendCode();
            else void legacyRegister(e);
          }}
          className="space-y-4"
        >
          <Input
            name="name"
            label="نام و نام خانوادگی"
            placeholder="مثال: علی محمدی"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="name"
            required
          />
          <Input
            name="mobile"
            label="شماره موبایل"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            value={formData.mobile}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
            ltr
            required
          />
          <Input
            name="email"
            type="email"
            label="ایمیل"
            placeholder="name@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            autoComplete="email"
            ltr
            required
          />
          <Input
            name="password"
            type="password"
            label={otpEnabled ? 'رمز عبور (اختیاری)' : 'رمز عبور'}
            placeholder={otpEnabled ? 'در صورت تمایل — حداقل ۸ کاراکتر' : 'حداقل ۸ کاراکتر'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="new-password"
            required={!otpEnabled}
          />
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <MathCaptcha onChange={setCaptcha} disabled={loading} />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'لطفاً صبر کنید...' : otpEnabled ? 'دریافت کد تأیید' : 'ثبت‌نام'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
