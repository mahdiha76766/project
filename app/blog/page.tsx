import Link from 'next/link';
import { Search, Filter, Flame, Sparkles } from 'lucide-react';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = String(sp.q || '').trim();
  const category = String(sp.category || '').trim();
  const sort = String(sp.sort || 'newest');

  await connectToDatabase();
  const filter: Record<string, unknown> = { isPublished: true };
  if (category) filter.category = category;
  if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { excerpt: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } }, { tags: { $regex: q, $options: 'i' } }];

  const sortObj = sort === 'popular' ? { views: -1, publishedAt: -1 } : { publishedAt: -1, createdAt: -1 };
  const posts = await BlogPost.find(filter).sort(sortObj).lean();
  const categories = await BlogPost.distinct('category', { isPublished: true });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-r from-[#f7efdf] via-[#f2e7d3] to-[#efe2ca] p-7 shadow-sm">
        <h1 className="text-3xl font-black text-[#4d382b]">وبلاگ آموزشی عصاره طبیعت</h1>
        <p className="mt-2 text-sm text-[#6c5847]">مقالات تخصصی روغن‌های طبیعی، ادویه‌ها، عصاری و راهنمای مصرف برای اعتمادسازی و انتخاب آگاهانه.</p>
      </section>

      <section className="mt-6 grid gap-3 rounded-2xl border border-[#e6dcc8] bg-white p-4 md:grid-cols-4">
        <form className="relative md:col-span-2" action="/blog">
          <Search size={16} className="absolute right-3 top-3.5 text-[#7b6757]" />
          <input name="q" defaultValue={q} placeholder="جستجو در مقالات..." className="h-11 w-full rounded-xl border border-[#e5dac5] bg-[#fffdf8] pr-9 pl-3" />
        </form>
        <form action="/blog" className="flex gap-2">
          <input type="hidden" name="q" value={q} />
          <Filter size={16} className="mt-3 text-[#7b6757]" />
          <select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-[#e5dac5] bg-[#fffdf8] px-3"> 
            <option value="">همه دسته‌بندی‌ها</option>
            {categories.map((c) => <option key={c} value={String(c)}>{String(c)}</option>)}
          </select>
        </form>
        <form action="/blog" className="flex gap-2">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="category" value={category} />
          <select name="sort" defaultValue={sort} className="h-11 w-full rounded-xl border border-[#e5dac5] bg-[#fffdf8] px-3"><option value="newest">جدیدترین</option><option value="popular">پربازدید</option></select>
        </form>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p: any) => (
          <article key={String(p._id)} className="group overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <img src={p.coverImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={p.title} className="h-52 w-full object-cover" />
            <div className="p-5">
              <div className="mb-2 flex items-center gap-2 text-xs text-[#7b6757]"><Sparkles size={14} />{p.category || 'عمومی'} <span>•</span> <Flame size={14} /> {Number(p.views || 0).toLocaleString('fa-IR')} بازدید</div>
              <h2 className="line-clamp-2 text-lg font-black text-[#5a3e2b]">{p.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-7 text-[#6e5847]">{p.excerpt || p.content}</p>
              <Link href={`/blog/${p.slug}`} className="mt-4 inline-flex items-center rounded-xl bg-[#f7f1e4] px-3 py-2 text-sm font-bold text-[#667744]">مطالعه مقاله</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
