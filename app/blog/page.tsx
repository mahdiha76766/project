import Link from 'next/link';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export default async function BlogPage() {
  await connectToDatabase();
  const posts = await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).lean();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-black text-[#4d382b]">بلاگ</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {posts.map((p: any) => (
          <article key={String(p._id)} className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white">
            {p.coverImage ? <img src={p.coverImage} alt={p.title} className="h-48 w-full object-cover" /> : null}
            <div className="p-5">
              <h2 className="text-lg font-bold text-[#5a3e2b]">{p.title}</h2>
              <p className="mt-2 text-sm text-[#6e5847] line-clamp-3">{p.excerpt || p.content || '---'}</p>
              <Link href={`/blog/${p.slug}`} className="mt-4 inline-block text-sm font-bold text-[#667744]">مشاهده مقاله</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
