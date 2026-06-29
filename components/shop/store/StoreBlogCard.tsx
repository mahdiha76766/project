import Link from 'next/link';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';
import { resolveImage } from '@/lib/shop/resolve-image';

export type StoreBlogItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  views?: number;
};

export function StoreBlogCard({ post }: { post: StoreBlogItem }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 transition hover:-translate-y-0.5 hover:shadow-card-hover">
      <Link href={`/blog/${post.slug}`}>
        <img
          src={resolveImage(post.coverImage)}
          alt={post.title}
          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="p-5">
        <p className="text-xs font-semibold text-brand-600">{post.category || 'عمومی'}</p>
        <Link href={`/blog/${post.slug}`}>
          <h2 className="mt-2 line-clamp-2 text-lg font-bold text-surface-900 group-hover:text-brand-700">{post.title}</h2>
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-surface-500">{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="site-link mt-4 group inline-flex">
          مطالعه
          <RtlForwardArrow className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function StoreBlogCompact({ slug, title, coverImage }: { slug: string; title: string; coverImage?: string }) {
  return (
    <Link href={`/blog/${slug}`} className="flex gap-3 rounded-xl p-2 transition hover:bg-surface-100">
      <img src={resolveImage(coverImage)} alt={title} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      <p className="line-clamp-3 text-sm font-semibold text-surface-900">{title}</p>
    </Link>
  );
}
