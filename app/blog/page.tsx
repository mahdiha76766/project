import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpArticleCard } from '@/components/feedar/ui/ArticleCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { FpSearchInput } from '@/components/feedar/ui/SearchInput';
import { buildQueryListMetadata } from '@/lib/seo/metadata';
import { BlogPost } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return buildQueryListMetadata(
    'اخبار و مقالات',
    `مقالات و اخبار تخصصی ${FEEDAR_BRAND.nameFa}`,
    '/blog',
    params
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = String(sp.q || '').trim();
  const category = String(sp.category || '').trim();

  const [posts, categories] = await withDatabase(async () => {
    const filter: Record<string, unknown> = { isPublished: true };
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }
    return Promise.all([
      BlogPost.find(filter).sort({ publishedAt: -1, createdAt: -1 }).lean(),
      BlogPost.distinct('category', { isPublished: true })
    ]);
  }, [[], []]);

  return (
    <>
      <FpPageHero
        kicker="مجله سلامت"
        title="اخبار و مقالات"
        description={`مطالب علمی، خبری و آموزشی ${FEEDAR_BRAND.nameFa}.`}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'مقالات' }]}
      />
      <Container className="space-y-8 py-10 lg:py-12">
        <form action="/blog" className="fp-card grid gap-3 p-4 sm:grid-cols-[1fr_16rem_auto]">
          <FpSearchInput bare action="/blog" defaultValue={q} placeholder="جستجو در مقالات" />
          <select name="category" defaultValue={category} className="fp-input">
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={String(c)} value={String(c)}>
                {String(c)}
              </option>
            ))}
          </select>
          <button type="submit" className="fp-btn-primary">
            فیلتر
          </button>
        </form>
        {!posts.length ? (
          <FpEmptyState title="مقاله‌ای یافت نشد" description="عبارت جستجو را تغییر دهید." actionHref="/blog" actionLabel="همه مقالات" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: Record<string, unknown>) => (
              <FpArticleCard
                key={String(p._id)}
                post={{
                  slug: String(p.slug),
                  title: String(p.title),
                  excerpt: String(p.excerpt || String(p.content || '').replace(/<[^>]+>/g, '').slice(0, 140)),
                  coverImage: p.coverImage as string | undefined,
                  category: String(p.category || ''),
                  dateLabel: p.publishedAt ? new Date(String(p.publishedAt)).toLocaleDateString('fa-IR') : undefined
                }}
              />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
