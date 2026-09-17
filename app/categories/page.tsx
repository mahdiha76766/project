import Link from 'next/link';
import { ArrowUpLeft, Layers3 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { StorePageHeader } from '@/components/shop/store/StorePageHeader';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';
import { buildMetadata } from '@/lib/seo/metadata';
import { resolveImage } from '@/lib/shop/resolve-image';
import { withAvailableProducts } from '@/lib/shop/available-products';
import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export const metadata = buildMetadata(
  'دسته‌بندی‌ها',
  'دسته‌بندی محصولات عطاری — روغن، ادویه و گیاهان دارویی در ناب سرا',
  { canonical: '/categories' }
);

export default async function CategoriesPage() {
  const [categories, counts] = await withDatabase(
    () => Promise.all([
      Category.find({ isActive: true }).sort({ createdAt: -1 }).lean(),
      Product.aggregate([
        { $match: withAvailableProducts() },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]),
    [[], []] as [unknown[], unknown[]]
  );
  const countMap = new Map((counts as Array<{ _id: unknown; count: number }>).map((item) => [String(item._id), item.count]));

  return (
    <>
      <StorePageHeader
        label="فروشگاه"
        title="دسته‌بندی محصولات"
        description="مجموعه‌های فروشگاه را بر اساس نوع محصول مرور کنید و سریع‌تر به انتخاب مناسب برسید."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'دسته‌بندی‌ها' }]}
      />
      <Container className="py-10 lg:py-12">
        <div className="mb-7 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white"><Layers3 className="h-4 w-4" /></span>
          <p><strong className="font-black">{categories.length.toLocaleString('fa-IR')} دسته فعال</strong><span className="mr-2 text-xs text-brand-700/70">برای مشاهده همه محصولات هر گروه، دسته را انتخاب کنید.</span></p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Link
              key={String(cat._id)}
              href={`/products?category=${cat.slug}`}
              className="group overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 transition hover:shadow-card"
            >
              <img src={resolveImage(cat.image)} alt={cat.name} className="aspect-[16/10] w-full object-cover transition group-hover:scale-105" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-black text-surface-900 group-hover:text-brand-700">{cat.name}</h2>
                  <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-black text-surface-500">{(countMap.get(String(cat._id)) || 0).toLocaleString('fa-IR')} محصول</span>
                </div>
                {cat.description ? <p className="mt-1 line-clamp-2 text-xs text-surface-500">{cat.description}</p> : null}
                <span className="site-link mt-4 text-xs group inline-flex">
                  مشاهده محصولات<RtlForwardArrow className="h-3 w-3" />
                </span>
                <ArrowUpLeft className="float-left -mt-7 h-4 w-4 text-surface-300 transition group-hover:text-brand-600" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
