import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpArticleCard, type FpArticle } from '@/components/feedar/ui/ArticleCard';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export function FeedarHomeArticles({ posts }: { posts: FpArticle[] }) {
  if (!posts.length) return null;

  return (
    <section className="site-section bg-surface-50">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FpSectionHeader title="اخبار و مقالات" description={`تازه‌ترین مطالب علمی و خبری ${FEEDAR_BRAND.nameFa}.`} />
          <Link href="/blog" className="fp-btn-outline !py-2 text-sm">
            همه مطالب
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <FpArticleCard key={post.slug} post={post} />
          ))}
        </div>
      </Container>
    </section>
  );
}
