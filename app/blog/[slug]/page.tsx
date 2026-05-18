import Link from 'next/link';
import { CalendarDays, UserRound, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';
import { BlogPost, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { BlogCommentsSection } from '@/components/shop/BlogCommentsSection';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).lean();
  if (!post) return { title: 'مقاله یافت نشد' };
  return {
    title: post.seoMetaTitle || `${post.title} | بلاگ عصاره طبیعت`,
    description: post.seoMetaDescription || String(post.excerpt || post.content || '').slice(0, 160),
    alternates: { canonical: `/blog/${post.slug}` }
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post: any = await BlogPost.findOneAndUpdate({ slug, isPublished: true }, { $inc: { views: 1 } }, { new: true }).lean();
  if (!post) notFound();

  const sidePosts = await BlogPost.find({ isPublished: true, slug: { $ne: post.slug } }).sort({ publishedAt: -1, createdAt: -1 }).limit(8).lean();
  const relatedPosts = await BlogPost.find({ isPublished: true, _id: { $ne: post._id }, $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }] }).sort({ publishedAt: -1 }).limit(3).lean();
  const relatedProducts = post.relatedProductIds?.length ? await Product.find({ _id: { $in: post.relatedProductIds }, isActive: true }).select('name slug price discountPrice images').lean() : [];

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
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#7d6b5b]"><span className='inline-flex items-center gap-1'><UserRound size={14}/>{post.author || 'تیم محتوا'}</span><span className='inline-flex items-center gap-1'><CalendarDays size={14}/>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fa-IR') : '-'}</span><span className='inline-flex items-center gap-1'><Tag size={14}/>{post.category || 'عمومی'}</span></div>
              {post.excerpt ? <p className="mt-4 rounded-xl bg-[#f7f2e8] p-4 text-sm leading-7 text-[#5f4a3c]">{post.excerpt}</p> : null}
              <article className="mt-6 whitespace-pre-wrap leading-8 text-[#5f4a3c]">{post.content}</article>
            </div>
          </article>

          {relatedProducts.length ? <section className='mt-8 rounded-3xl border border-[#e6dcc8] bg-white p-5'><h3 className='text-lg font-black text-[#4d382b]'>محصولات مرتبط</h3><div className='mt-4 grid gap-3 md:grid-cols-3'>{relatedProducts.map((p:any)=><Link key={String(p._id)} href={`/products/${p.slug}`} className='rounded-xl border border-[#eee2cf] p-3'><img src={p.images?.[0] || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={p.name} className='h-28 w-full rounded-lg object-cover'/><p className='mt-2 text-sm font-bold text-[#5a3e2b]'>{p.name}</p><p className='text-xs text-[#6f5a4a]'>{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</p></Link>)}</div></section> : null}

          {relatedPosts.length ? <section className='mt-8 rounded-3xl border border-[#e6dcc8] bg-white p-5'><h3 className='text-lg font-black text-[#4d382b]'>مقالات مرتبط</h3><div className='mt-4 grid gap-3 md:grid-cols-3'>{relatedPosts.map((p:any)=><Link key={String(p._id)} href={`/blog/${p.slug}`} className='rounded-xl border border-[#eee2cf] p-3 text-sm font-bold text-[#5a3e2b]'>{p.title}</Link>)}</div></section> : null}

          <BlogCommentsSection slug={post.slug} />
        </div>
      </div>
    </main>
  );
}
