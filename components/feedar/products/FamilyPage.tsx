import { Container } from '@/components/ui/Container';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FEEDAR_PRODUCT_LINES, type FeedarProductLine } from '@/lib/brand/feedar';
import { fetchProductsByLine } from '@/lib/feedar/product-families';
import { buildPublicMetadata } from '@/lib/seo/metadata';

export function familyPageMetadata(line: FeedarProductLine) {
  const meta = FEEDAR_PRODUCT_LINES[line];
  return buildPublicMetadata({
    title: meta.title,
    description: meta.description,
    canonicalPath: meta.href
  });
}

export async function FeedarFamilyPage({ line }: { line: FeedarProductLine }) {
  const meta = FEEDAR_PRODUCT_LINES[line];
  const products = await fetchProductsByLine(line, 24);

  return (
    <>
      <FpPageHero
        kicker="سبد محصولات"
        title={meta.title}
        description={meta.description}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'محصولات', href: '/products' }, { label: meta.title }]}
      />
      <Container className="py-12">
        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <FeedarProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <FpEmptyState
            title="هنوز محصولی در این خط ثبت نشده"
            description="پس از تخصیص خط محصول در پنل مدیریت، فهرست این صفحه به‌صورت خودکار تکمیل می‌شود."
            actionHref="/products"
            actionLabel="مشاهده همه محصولات"
          />
        )}
      </Container>
    </>
  );
}
