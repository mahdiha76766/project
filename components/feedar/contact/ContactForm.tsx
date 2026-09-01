'use client';

import { useState } from 'react';
import { FpAlert } from '@/components/feedar/ui/Alert';

export function FeedarContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(formData: FormData) {
    if (status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') || ''),
          email: String(formData.get('email') || ''),
          phone: String(formData.get('phone') || ''),
          subject: String(formData.get('subject') || ''),
          message: String(formData.get('message') || '')
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'ارسال ناموفق بود.');
        return;
      }
      setStatus('success');
      setMessage('پیام شما ثبت شد. به‌زودی با شما تماس می‌گیریم.');
    } catch {
      setStatus('error');
      setMessage('ارتباط با سرور برقرار نشد.');
    }
  }

  return (
    <form
      className="fp-card space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new FormData(event.currentTarget));
      }}
    >
      {status === 'success' ? <FpAlert tone="success">{message}</FpAlert> : null}
      {status === 'error' ? <FpAlert tone="danger">{message}</FpAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">نام</label>
          <input id="name" name="name" required className="fp-input" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">ایمیل</label>
          <input id="email" name="email" type="email" required className="fp-input" dir="ltr" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">تلفن</label>
          <input id="phone" name="phone" className="fp-input" dir="ltr" />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-semibold">موضوع</label>
          <input id="subject" name="subject" className="fp-input" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold">پیام</label>
        <textarea id="message" name="message" required rows={5} className="fp-input h-auto py-3" />
      </div>
      <button type="submit" disabled={status === 'loading'} className="fp-btn-primary">
        {status === 'loading' ? 'در حال ارسال...' : 'ارسال پیام'}
      </button>
    </form>
  );
}
