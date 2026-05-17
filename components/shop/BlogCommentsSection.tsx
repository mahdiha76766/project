'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type BlogComment = { _id: string; userName?: string; comment: string; createdAt: string };

export function BlogCommentsSection({ slug }: { slug: string }) {
  const user = useCurrentUser();
  const [items, setItems] = useState<BlogComment[]>([]);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await fetch(`/api/blog/${slug}/comments`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => { void load(); }, [slug]);

  const submit = async () => {
    if (!comment.trim() || comment.trim().length < 5) return setMessage('متن دیدگاه باید حداقل ۵ کاراکتر باشد.');
    const res = await fetch(`/api/blog/${slug}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment }) });
    const data = await res.json();
    setMessage(data.message || data.error || 'خطا در ثبت دیدگاه');
    if (res.ok) setComment('');
  };

  return <section className="mt-10 rounded-3xl border border-[#e8dcc6] bg-white p-5 shadow-sm">
    <h2 className="text-xl font-black text-[#4d382b]">دیدگاه کاربران</h2>
    {!user ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">برای ارسال دیدگاه وارد حساب کاربری شوید.</p> : <div className="mt-4 space-y-3"><textarea value={comment} onChange={(e)=>setComment(e.target.value)} className="min-h-28 w-full rounded-xl border border-[#e2d7c3] p-3" placeholder="دیدگاه خود را بنویسید..."/><button onClick={submit} className="rounded-xl bg-[#667744] px-4 py-2 text-sm font-bold text-white">ارسال دیدگاه</button>{message ? <p className="text-sm text-[#6c5847]">{message}</p> : null}</div>}
    <div className="mt-6 space-y-3">{items.length===0 ? <p className="rounded-xl border border-dashed border-[#e0d5c2] bg-[#fffdf8] p-4 text-sm text-[#7a6858]">هنوز دیدگاهی ثبت نشده است.</p> : items.map((c)=><article key={c._id} className="rounded-xl border border-[#ede2d0] bg-[#fffdfa] p-4"><p className="text-sm leading-7 text-[#5f4a3c]">{c.comment}</p><p className="mt-2 text-xs text-[#8b7763]">{c.userName || 'کاربر'} - {new Date(c.createdAt).toLocaleDateString('fa-IR')}</p></article>)}</div>
  </section>;
}
