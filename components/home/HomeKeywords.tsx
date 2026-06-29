import Link from 'next/link';

export function HomeKeywords({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null;

  return (
    <section className="border-y border-surface-200 bg-surface-0 py-8">
      <div className="site-container">
        <p className="text-center text-xs font-bold text-surface-500">کلمات کلیدی و موضوعات محبوب</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {keywords.map((kw) => (
            <Link
              key={kw}
              href={`/products?q=${encodeURIComponent(kw)}`}
              className="rounded-full border border-brand-200/80 bg-brand-50/50 px-4 py-2 text-sm font-bold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100"
            >
              {kw}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
