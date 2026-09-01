import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FpBadge } from '@/components/feedar/ui/Badge';
import { resolveImage } from '@/lib/shop/resolve-image';

export type FpArticle = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  dateLabel?: string;
};

export function FpArticleCard({ post }: { post: FpArticle }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-paper-200 bg-paper-50 shadow-soft">
      <Link href={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden bg-ink-900/5">
        <img
          src={resolveImage(post.coverImage)}
          alt={post.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
      </Link>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.category ? <FpBadge>{post.category}</FpBadge> : null}
          {post.dateLabel ? <span className="text-xs text-surface-400">{post.dateLabel}</span> : null}
        </div>
        <h3 className="mt-3 text-lg font-black leading-8 text-ink-900">
          <Link href={`/blog/${post.slug}`} className="hover:text-gold-600">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-surface-500">{post.excerpt}</p>
        <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-800">
          ادامه مطلب
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
