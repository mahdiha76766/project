'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Review = { _id: string; rating: number; title?: string; comment: string; createdAt: string; user?: { name?: string } };

export function ProductReviewsSection({ slug }: { slug: string }) {
  const user = useCurrentUser();
  const [items, setItems] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });

  const load = async () => {
    const res = await fetch(`/api/products/${slug}/reviews`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setAverageRating(data.averageRating || 0);
  };

  useEffect(() => { void load(); }, [slug]);

  const submit = async () => {
    if (!form.rating) return setMessage('امتیازدهی الزامی است.');
    if (!form.comment.trim() || form.comment.trim().length < 10) return setMessage('متن نظر باید حداقل ۱۰ کاراکتر باشد.');

    const res = await fetch(`/api/products/${slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setMessage(data.message || data.error || 'خطا در ثبت نظر');
    if (res.ok) {
      setForm({ rating: 0, title: '', comment: '' });
      void load();
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-[#e6dcc8] bg-white p-5">
      <div className="flex items-center justify-between"><h2 className="text-xl font-black text-[#4d382b]">نظرات کاربران</h2><p className="text-sm text-[#7b6757]">میانگین امتیاز: {averageRating || 0} از 5</p></div>

      {!user ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">برای ثبت نظر باید وارد حساب کاربری شوید.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#5f4a3c]">امتیاز</p>
            <div className="flex gap-1">{[1,2,3,4,5].map((n)=><button key={n} type="button" onClick={()=>setForm({...form,rating:n})} className={`text-2xl ${form.rating>=n?'text-amber-500':'text-slate-300'}`}>★</button>)}</div>
          </div>
          <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="عنوان کوتاه نظر" className="h-11 rounded-xl border border-slate-200 px-3" />
          <textarea value={form.comment} onChange={(e)=>setForm({...form,comment:e.target.value})} placeholder="متن نظر شما" className="min-h-28 rounded-xl border border-slate-200 p-3" />
          <button onClick={submit} className="h-11 w-fit rounded-xl bg-[#667744] px-5 text-sm font-bold text-white">ثبت نظر</button>
          {message ? <p className="text-sm text-[#5a3e2b]">{message}</p> : null}
        </div>
      )}

      <div className="mt-7 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#dfd2bc] bg-[#fffdf8] p-4 text-sm text-[#7b6757]">هنوز نظری برای این محصول ثبت نشده است. شما اولین نفر باشید.</p>
        ) : items.map((r) => (
          <article key={r._id} className="rounded-xl border border-[#eee2cf] bg-[#fffdf9] p-4">
            <div className="flex items-center justify-between"><h3 className="font-bold text-[#5a3e2b]">{r.title || 'بدون عنوان'}</h3><span className="text-amber-500">{'★'.repeat(r.rating)}</span></div>
            <p className="mt-2 text-sm leading-7 text-[#6c5847]">{r.comment}</p>
            <p className="mt-2 text-xs text-[#8b7763]">{r.user?.name || 'کاربر'} - {new Date(r.createdAt).toLocaleDateString('fa-IR')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
