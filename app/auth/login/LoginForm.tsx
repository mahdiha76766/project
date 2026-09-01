'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthAlert, AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { normalizeMobile, isValidMobile } from '@/lib/validation/mobile';
import { MathCaptcha, type CaptchaValue } from '@/components/security/MathCaptcha';

const redirectByRole = (role?: string, next?: string) => {
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : '';
  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'CONTENT_MANAGER') {
    return safe.startsWith('/admin') ? safe : '/admin';
  }
  if (safe.startsWith('/dashboard')) return safe;
  if (role === 'CUSTOMER') return '/dashboard';
  return '/';
};

type OtpConfig = {
  enabled: boolean;
  otpEnabled: boolean;
  allowPasswordLogin: boolean;
  resendSeconds: number;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetMobile = searchParams.get('mobile') || '';
  const nextPath = searchParams.get('next') || '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState(presetMobile);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [config, setConfig] = useState<OtpConfig | null>(null);
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: '', answer: '' });

  useEffect(() => {
    fetch('/api/auth/otp/send')
      .then((r) => r.json())
      .then((data: OtpConfig) => {
        setConfig(data);
        if (!data.otpEnabled) setMode('password');
      })
      .catch(() => setMode('password'));
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    setError('');
    const normalized = normalizeMobile(mobile);
    if (!isValidMobile(normalized)) {
      setError('شماره موبایل معتبر نیست');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: normalized,
        purpose: 'login',
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
    setMobile(normalized);
    setStep('code');
    setCountdown(data.resendAfter || 60);
  };

  const verifyCode = async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mobile: normalizeMobile(mobile), code, purpose: 'login' })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'کد نامعتبر است');
      return;
    }
    router.push(redirectByRole(data.role, nextPath));
    router.refresh();
  };

  const passwordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        mobile: normalizeMobile(String(form.get('mobile') || '')),
        password: String(form.get('password') || ''),
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer
      })
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'ورود انجام نشد');
      return;
    }
    router.push(redirectByRole(data.role, nextPath));
    router.refresh();
  };

  const otpActive = config?.otpEnabled && mode === 'otp';

  return (
    <AuthLayout
      variant="login"
      title="ورود به حساب"
      description={otpActive ? 'کد تأیید به موبایل شما ارسال می‌شود.' : 'شماره موبایل و رمز عبور خود را وارد کنید.'}
      footer={
        <>
          حساب ندارید؟ <AuthLink href="/auth/register">ثبت‌نام کنید</AuthLink>
        </>
      }
    >
      {config?.otpEnabled && config.allowPasswordLogin ? (
        <div className="mb-4 flex rounded-xl bg-slate-100 p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 font-bold transition ${mode === 'otp' ? 'bg-white shadow' : 'text-slate-500'}`}
            onClick={() => { setMode('otp'); setStep('mobile'); setError(''); }}
          >
            ورود با کد
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2 font-bold transition ${mode === 'password' ? 'bg-white shadow' : 'text-slate-500'}`}
            onClick={() => { setMode('password'); setError(''); }}
          >
            ورود با رمز
          </button>
        </div>
      ) : null}

      {otpActive ? (
        step === 'mobile' ? (
          <div className="space-y-4">
            <Input
              name="mobile"
              label="شماره موبایل"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              ltr
              required
            />
            {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
            <MathCaptcha onChange={setCaptcha} disabled={loading} />
            <Button type="button" fullWidth disabled={loading} onClick={sendCode}>
              {loading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              کد به <span dir="ltr" className="font-bold">{mobile}</span> ارسال شد
            </p>
            <Input
              name="code"
              label="کد تأیید"
              placeholder="۱۲۳۴۵"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              ltr
              required
            />
            {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
            <Button type="button" fullWidth disabled={loading || code.length < 4} onClick={verifyCode}>
              {loading ? 'لطفاً صبر کنید...' : 'تأیید و ورود'}
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-amber-700" onClick={() => setStep('mobile')}>
                تغییر شماره
              </button>
              <button
                type="button"
                className="text-slate-500 disabled:opacity-50"
                disabled={countdown > 0 || loading}
                onClick={sendCode}
              >
                {countdown > 0 ? `ارسال مجدد (${countdown})` : 'ارسال مجدد کد'}
              </button>
            </div>
          </div>
        )
      ) : (
        <form onSubmit={passwordLogin} className="space-y-4">
          <Input
            name="mobile"
            label="شماره موبایل"
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            defaultValue={presetMobile}
            inputMode="tel"
            autoComplete="tel"
            ltr
            required
          />
          <Input
            name="password"
            type="password"
            label="رمز عبور"
            placeholder="رمز عبور خود را وارد کنید"
            autoComplete="current-password"
            required
          />
          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          <MathCaptcha onChange={setCaptcha} disabled={loading} />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'لطفاً صبر کنید...' : 'ورود'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
