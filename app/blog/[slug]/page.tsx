import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/data/shop-data';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: 'مقاله یافت نشد' };
  return {
    title: `${post.title} | بلاگ عصاره طبیعت`,
    description: `مطالعه مقاله ${post.title}`,
    alternates: { canonical: `/blog/${post.slug}` }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-bold">{post.title}</h1><p className="mt-3">محتوای مقاله به‌صورت داینامیک از CMS بارگذاری می‌شود.</p></main>;
}
