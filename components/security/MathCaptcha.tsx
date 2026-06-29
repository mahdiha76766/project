'use client';

import { useCallback, useEffect, useState } from 'react';
import { HiOutlineRefresh, HiOutlineShieldCheck } from 'react-icons/hi';
import { cn } from '@/lib/utils/cn';

export type CaptchaValue = {
  token: string;
  answer: string;
};

type Props = {
  value?: CaptchaValue;
  onChange: (value: CaptchaValue) => void;
  className?: string;
  disabled?: boolean;
};

export function MathCaptcha({ value, onChange, className, disabled }: Props) {
  const [question, setQuestion] = useState('');
  const [token, setToken] = useState('');
  const [answer, setAnswer] = useState(value?.answer || '');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/captcha/challenge', { cache: 'no-store' });
      const data = await res.json();
      setQuestion(data.question || '');
      setToken(data.token || '');
      setAnswer('');
      onChange({ token: data.token || '', answer: '' });
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAnswer = (next: string) => {
    const digits = next.replace(/[^\d۰-۹]/g, '');
    setAnswer(digits);
    onChange({ token, answer: digits });
  };

  return (
    <div className={cn('rounded-2xl border border-surface-200 bg-gradient-to-l from-brand-50/60 to-white p-4', className)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-brand-700">
        <HiOutlineShieldCheck className="h-4 w-4" />
        تأیید امنیتی — حاصل عبارت زیر را وارد کنید
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[9rem] items-center justify-center rounded-xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
          <span className="text-xl font-black tracking-wide text-surface-900" dir="ltr">
            {loading ? '...' : question}
          </span>
        </div>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={answer}
          onChange={(e) => handleAnswer(e.target.value)}
          disabled={disabled || loading || !token}
          placeholder="پاسخ"
          className="site-input !w-28 text-center !text-lg !font-black"
          aria-label="پاسخ کپچا"
        />

        <button
          type="button"
          onClick={() => void load()}
          disabled={disabled || loading}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-200 bg-white text-surface-600 transition hover:border-brand-200 hover:text-brand-700"
          aria-label="کپچای جدید"
        >
          <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
        </button>
      </div>
    </div>
  );
}
