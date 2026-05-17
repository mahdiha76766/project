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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <article className="overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm">
        <img src={post.coverImage || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={post.title} className="h-72 w-full object-cover" />
        <div className="p-6">
          <h1 className="text-3xl font-black text-[#4d382b]">{post.title}</h1>
          {post.excerpt ? <p className="mt-4 rounded-xl bg-[#f7f2e8] p-4 text-sm leading-7 text-[#5f4a3c]">{post.excerpt}</p> : null}
          <article className="mt-6 whitespace-pre-wrap leading-8 text-[#5f4a3c]">{post.content}</article>
        </div>
      </article>
      <BlogCommentsSection slug={post.slug} />
    </main>
  );
}
