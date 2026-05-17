import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { BlogCommentsSection } from '@/components/shop/BlogCommentsSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) return { title: 'مقاله یافت نشد' };
  return { title: `${post.title} | بلاگ عصاره طبیعت`, description: String(post.excerpt || post.content || '').slice(0, 160), alternates: { canonical: `/blog/${post.slug}` } };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) notFound();

  const sidePosts = await BlogPost.find({ isPublished: true, slug: { $ne: post.slug } }).sort({ publishedAt: -1, createdAt: -1 }).limit(8).lean();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
        <aside className="order-2 lg:order-1">
          <div className="top-6 rounded-3xl border border-[#e6dcc8] bg-white p-4 shadow-sm lg:sticky">
            <h3 className="mb-3 text-lg font-black text-[#4d382b]">سایر مقالات</h3>
            <div className="space-y-3">
              {sidePosts.map((p: any) => (
                <Link key={String(p._id)} href={`/blog/${p.slug}`} className="group flex gap-3 rounded-2xl border border-[#efe4d0] p-2 transition hover:bg-[#faf5ea]">
                  <img src={p.coverImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={p.title} className="h-16 w-16 rounded-xl object-cover" />
                  <div><p className="line-clamp-2 text-sm font-bold text-[#5a3e2b]">{p.title}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="order-1 lg:order-2">
          <article className="overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm">
            <img src={post.coverImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={post.title} className="h-72 w-full object-cover" />
            <div className="p-6">
              <h1 className="text-3xl font-black text-[#4d382b]">{post.title}</h1>
              {post.excerpt ? <p className="mt-4 rounded-xl bg-[#f7f2e8] p-4 text-sm leading-7 text-[#5f4a3c]">{post.excerpt}</p> : null}
              <article className="mt-6 whitespace-pre-wrap leading-8 text-[#5f4a3c]">{post.content}</article>
            </div>
          </article>
          <BlogCommentsSection slug={post.slug} />
        </div>
      </div>
    </main>
  );
}
