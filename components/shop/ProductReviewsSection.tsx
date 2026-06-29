'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MathCaptcha, type CaptchaValue } from '@/components/security/MathCaptcha';

type Review = { _id: string; rating: number; title?: string; comment: string; createdAt: string; user?: { name?: string } };

export function ProductReviewsSection({ slug }: { slug: string }) {
  const user = useCurrentUser();
  const [items, setItems] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: '', answer: '' });

  const load = async () => {
    const res = await fetch(`/api/products/${slug}/reviews`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setAverageRating(data.averageRating || 0);
  };

  useEffect(() => { void load(); }, [slug]);

  const submit = async () => {
    if (!form.rating) return setMessage('امتیاز الزامی است.');
    if (form.comment.trim().length < 10) return setMessage('نظر حداقل ۱۰ کاراکتر.');
    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer
      })
    });
    const data = await res.json();
    setMessage(data.message || data.error || 'خطا');
    if (res.ok) {
      setForm({ rating: 0, title: '', comment: '' });
      void load();
    }
  };

  return (
    <section className="rounded-2xl border border-surface-200 bg-surface-0 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-surface-900">نظرات</h2>
        <span className="text-sm text-surface-500">میانگین {averageRating || 0}/۵</span>
      </div>

      {!user ? (
        <p className="mt-4 rounded-xl bg-surface-100 p-4 text-sm text-surface-600">برای ثبت نظر وارد شوید.</p>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-surface-200 p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} className={form.rating >= n ? 'text-accent-500' : 'text-surface-300'}>
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
          </div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان" className="site-input" />
          <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="نظر شما" className="site-input min-h-24 py-3" />
          <MathCaptcha onChange={setCaptcha} />
          <button type="button" onClick={submit} className="site-btn-primary">ثبت</button>
          {message ? <p className="text-sm text-surface-600">{message}</p> : null}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-surface-500">هنوز نظری ثبت نشده.</p>
        ) : items.map((r) => (
          <article key={r._id} className="rounded-xl bg-surface-100 p-4">
            <div className="flex justify-between">
              <p className="font-semibold text-surface-900">{r.title || 'بدون عنوان'}</p>
              <span className="flex text-accent-500">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-surface-600">{r.comment}</p>
            <p className="mt-2 text-xs text-surface-400">{r.user?.name || 'کاربر'} · {new Date(r.createdAt).toLocaleDateString('fa-IR')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
