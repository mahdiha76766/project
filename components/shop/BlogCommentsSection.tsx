'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MathCaptcha, type CaptchaValue } from '@/components/security/MathCaptcha';

type BlogComment = { _id: string; userName?: string; comment: string; createdAt: string };

export function BlogCommentsSection({ slug }: { slug: string }) {
  const user = useCurrentUser();
  const [items, setItems] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: '', answer: '' });

  const load = async () => {
    const res = await fetch(`/api/blog/${slug}/comments`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { void load(); }, [slug]);

  const submit = async () => {
    if (comment.trim().length < 5) return setMessage('حداقل ۵ کاراکتر.');
    const res = await fetch(`/api/blog/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer
      })
    });
    const data = await res.json();
    setMessage(data.message || data.error || 'خطا');
    if (res.ok) {
      setComment('');
      void load();
    }
  };

  return (
    <section className="rounded-2xl border border-surface-200 bg-surface-0 p-6">
      <h2 className="font-bold text-surface-900">دیدگاه‌ها</h2>
      {!user ? (
        <p className="mt-4 rounded-xl bg-surface-100 p-4 text-sm text-surface-600">برای ارسال دیدگاه وارد شوید.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="site-input min-h-24 py-3" placeholder="دیدگاه..." />
          <MathCaptcha onChange={setCaptcha} />
          <button type="button" onClick={submit} className="site-btn-primary">ارسال</button>
          {message ? <p className="text-sm text-surface-600">{message}</p> : null}
        </div>
      )}
      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-surface-500">دیدگاهی نیست.</p>
        ) : items.map((c) => (
          <article key={c._id} className="rounded-xl bg-surface-100 p-4">
            <p className="text-sm leading-7 text-surface-700">{c.comment}</p>
            <p className="mt-2 text-xs text-surface-400">{c.userName || 'کاربر'} · {new Date(c.createdAt).toLocaleDateString('fa-IR')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
