import Link from 'next/link';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export default async function BlogPage() {
  await connectToDatabase();
  const posts = await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).lean();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-r from-[#f7efdf] to-[#efe2ca] p-7">
        <h1 className="text-3xl font-black text-[#4d382b]">بلاگ عصاره طبیعت</h1>
        <p className="mt-2 text-sm text-[#6c5847]">مطالب آموزشی روغن‌های طبیعی، ادویه‌ها و سبک زندگی سالم.</p>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p: any) => (
          <article key={String(p._id)} className="group overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <img src={p.coverImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={p.title} className="h-52 w-full object-cover" />
            <div className="p-5">
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
