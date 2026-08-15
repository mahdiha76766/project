import { Container } from '@/components/ui/Container';
import { StorePageHeader, StoreEmpty } from '@/components/shop/store/StorePageHeader';
import { StoreBlogCard } from '@/components/shop/store/StoreBlogCard';
import { StoreBlogToolbar } from '@/components/shop/store/StoreFilters';
import { buildQueryListMetadata } from '@/lib/seo/metadata';
import { BlogPost } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return buildQueryListMetadata(
    'مجله سلامت',
    'مقالات تخصصی روغن، ادویه و گیاهان دارویی — مجله ناب سرا',
    '/blog',
    params
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = String(sp.q || '').trim();
  const category = String(sp.category || '').trim();
  const sort = String(sp.sort || 'newest');

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
    const sortObj = sort === 'popular' ? { views: -1, publishedAt: -1 } : { publishedAt: -1, createdAt: -1 };
    return Promise.all([
      BlogPost.find(filter).sort(sortObj as any).lean(),
      BlogPost.distinct('category', { isPublished: true })
    ]);
  }, [[], []]);

  const items = posts.map((p: any) => ({
    id: String(p._id),
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || String(p.content || '').slice(0, 140),
    coverImage: p.coverImage,
    category: p.category,
    views: p.views
  }));

  return (
    <>
      <StorePageHeader
        label="مجله"
        title="وبلاگ"
        description="مقالات تخصصی روغن، ادویه و گیاهان دارویی."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'وبلاگ' }]}
      />
      <Container className="space-y-8 py-10 lg:py-12">
        <StoreBlogToolbar categories={categories.map(String)} defaults={{ q, category, sort }} />
        {!items.length ? (
          <StoreEmpty message="مقاله‌ای یافت نشد." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => <StoreBlogCard key={post.id} post={post} />)}
          </div>
        )}
      </Container>
    </>
  );
}
