import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { resolveImage } from '@/lib/shop/resolve-image';

export function FpCategoryCard({
  href,
  title,
  description,
  image
}: {
  href: string;
  title: string;
  description: string;
  image: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-paper-200 bg-paper-50 shadow-soft">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={resolveImage(image)}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
          <h3 className="absolute bottom-4 start-4 text-lg font-black text-paper-50">{title}</h3>
        </div>
        <div className="p-5">
          <p className="line-clamp-2 text-sm leading-7 text-surface-500">{description}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-800">
            مشاهده خط محصول
            <ArrowLeft className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </article>
  );
}
