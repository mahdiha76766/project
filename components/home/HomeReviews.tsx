import Link from 'next/link';
import { MessageSquareQuote, Star } from 'lucide-react';
import { Section } from './Section';

export type HomeReview = {
  id: string;
  userName: string;
  title: string;
  comment: string;
  rating: number;
  productName?: string;
  productSlug?: string;
};

export function HomeReviews({ reviews }: { reviews: HomeReview[] }) {
  if (!reviews.length) return null;

  return (
    <Section bg="default" className="!py-12 lg:!py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="site-label">تجربه خریداران</p>
          <h2 className="mt-2 text-2xl font-black text-surface-900 sm:text-3xl">نظرهای ثبت‌شده مشتریان</h2>
          <p className="mt-2 text-sm text-surface-500">نظرهای تأییدشده درباره محصولات فروشگاه.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-xs font-black text-surface-700"><MessageSquareQuote className="h-4 w-4 text-brand-600" /> خرید آگاهانه‌تر</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {reviews.slice(0, 3).map((review) => (
          <article key={review.id} className="flex min-h-64 flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
            <div className="flex gap-1 text-amber-500" aria-label={`${review.rating} از ۵ ستاره`}>
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-surface-200'}`} />)}
            </div>
            {review.title ? <h3 className="mt-4 text-sm font-black text-surface-900">{review.title}</h3> : null}
            <p className="mt-3 line-clamp-5 text-sm leading-7 text-surface-600">«{review.comment}»</p>
            <div className="mt-auto flex items-end justify-between gap-3 border-t border-surface-100 pt-4">
              <span className="text-xs font-black text-surface-800">{review.userName || 'خریدار محصول'}</span>
              {review.productSlug ? <Link href={`/products/${review.productSlug}`} className="max-w-[55%] truncate text-[10px] font-bold text-brand-700">{review.productName}</Link> : null}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
