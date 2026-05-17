import { notFound } from 'next/navigation';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) return { title: 'مقاله یافت نشد' };
  return {
    title: `${post.title} | بلاگ عصاره طبیعت`,
    description: String(post.excerpt || post.content || '').slice(0, 160),
    alternates: { canonical: `/blog/${post.slug}` }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      {post.coverImage ? <img src={post.coverImage} alt={post.title} className="h-64 w-full rounded-2xl object-cover" /> : null}
      <h1 className="mt-5 text-2xl font-black text-[#4d382b]">{post.title}</h1>
      {post.excerpt ? <p className="mt-3 rounded-xl bg-[#f7f2e8] p-4 text-sm leading-7 text-[#5f4a3c]">{post.excerpt}</p> : null}
      <article className="mt-6 whitespace-pre-wrap leading-8 text-[#5f4a3c]">{post.content}</article>
    </main>
  );
}
