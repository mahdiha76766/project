import { notFound } from 'next/navigation';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) return { title: 'مقاله یافت نشد' };
  return { title: `${post.title} | بلاگ عصاره طبیعت`, description: String(post.content || '').slice(0, 160), alternates: { canonical: `/blog/${post.slug}` } };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) notFound();
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-bold text-[#4d382b]">{post.title}</h1><article className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap leading-8 text-[#5f4a3c]">{post.content}</article></main>;
}
