import Link from 'next/link';
import { ChevronLeft, Leaf, Search, ShieldCheck, SlidersHorizontal, Sparkles, Truck, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { StoreProductCard } from '@/components/shop/store/StoreProductCard';
import { PRODUCT_USAGE_OPTIONS, StoreFilters } from '@/components/shop/store/StoreFilters';
import { StorePagination } from '@/components/shop/store/StorePagination';
import { StoreEmpty } from '@/components/shop/store/StorePageHeader';
import { buildQueryListMetadata } from '@/lib/seo/metadata';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import type { ShopProduct } from '@/types/shop';

const PAGE_SIZE = 18;
const ALLOWED_USAGE_TYPES = new Set<string>(PRODUCT_USAGE_OPTIONS.map((item) => item.value));
const ALLOWED_SORTS = new Set(['newest', 'best_selling', 'cheapest', 'expensive']);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (char) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(char)))
    .replace(/[,٬\s]/g, '');
}

function parsePrice(value: string) {
  if (!value.trim()) return undefined;
  const number = Number(normalizeDigits(value));
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function productsHref(params: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries({ ...params, ...patch, page: undefined }).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const search = query.toString();
  return search ? `/products?${search}` : '/products';
}

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return buildQueryListMetadata(
    'محصولات',
    'خرید روغن، ادویه و محصولات گیاهی — فروشگاه آنلاین ناب سرا',
    '/products',
    params
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = String(params.q || '').trim().slice(0, 80);
  const category = String(params.category || '').trim();
  const requestedSort = String(params.sort || 'newest');
  const sort = ALLOWED_SORTS.has(requestedSort) ? requestedSort : 'newest';
  const usage = ALLOWED_USAGE_TYPES.has(String(params.usage)) ? String(params.usage) : '';
  const parsedMinPrice = parsePrice(String(params.minPrice || ''));
  const parsedMaxPrice = parsePrice(String(params.maxPrice || ''));
  const minPrice = parsedMinPrice !== undefined && parsedMaxPrice !== undefined
    ? Math.min(parsedMinPrice, parsedMaxPrice)
    : parsedMinPrice;
  const maxPrice = parsedMinPrice !== undefined && parsedMaxPrice !== undefined
    ? Math.max(parsedMinPrice, parsedMaxPrice)
    : parsedMaxPrice;
  const stockOnly = params.stock === '1';
  const discountOnly = params.discount === '1';
  const requestedPage = Math.max(1, Math.floor(Number(params.page) || 1));

  const [items, categories, total] = await withDatabase(async () => {
    const filter: Record<string, unknown> = { isActive: true };
    const andFilters: Record<string, unknown>[] = [];
    if (category) {
      const foundCategory = await Category.findOne({ slug: category, isActive: true }).select('_id').lean() as { _id?: unknown } | null;
      filter.category = foundCategory?._id || null;
    }
    if (q) {
      const safeQuery = escapeRegex(q);
      andFilters.push({ $or: [
        { name: { $regex: safeQuery, $options: 'i' } },
        { shortDescription: { $regex: safeQuery, $options: 'i' } },
        { fullDescription: { $regex: safeQuery, $options: 'i' } },
        { tags: { $regex: safeQuery, $options: 'i' } }
      ] });
    }
    if (usage) filter.usageType = usage;
    if (stockOnly) andFilters.push({ $or: [{ stock: { $gt: 0 } }, { 'variants.stock': { $gt: 0 } }] });
    if (discountOnly) andFilters.push({ $or: [{ discountPrice: { $gt: 0 } }, { 'variants.discountPrice': { $gt: 0 } }] });
    if (minPrice !== undefined || maxPrice !== undefined) {
      const effectivePrice = {
        $cond: [
          { $and: [{ $ne: ['$discountPrice', null] }, { $gt: ['$discountPrice', 0] }] },
          '$discountPrice',
          '$price'
        ]
      };
      const priceConditions: Record<string, unknown>[] = [];
      if (minPrice !== undefined) priceConditions.push({ $gte: [effectivePrice, minPrice] });
      if (maxPrice !== undefined) priceConditions.push({ $lte: [effectivePrice, maxPrice] });
      andFilters.push({ $expr: priceConditions.length === 1 ? priceConditions[0] : { $and: priceConditions } });
    }
    if (andFilters.length) filter.$and = andFilters;

    const sortObj = sort === 'best_selling' ? { isFeatured: -1, createdAt: -1 } : { createdAt: -1 };
    const effectivePrice = {
      $cond: [
        { $and: [{ $ne: ['$discountPrice', null] }, { $gt: ['$discountPrice', 0] }] },
        '$discountPrice',
        '$price'
      ]
    };
    const listingQuery = sort === 'cheapest' || sort === 'expensive'
      ? Product.aggregate([
          { $match: filter },
          { $addFields: { effectivePrice } },
          { $sort: { effectivePrice: sort === 'cheapest' ? 1 : -1, createdAt: -1 } },
          { $skip: (requestedPage - 1) * PAGE_SIZE },
          { $limit: PAGE_SIZE }
        ])
      : Product.find(filter)
          .sort(sortObj as any)
          .skip((requestedPage - 1) * PAGE_SIZE)
          .limit(PAGE_SIZE)
          .populate('category', 'slug')
          .lean();

    return Promise.all([
      listingQuery,
      Category.find({ isActive: true }).sort({ name: 1 }).select('slug name').lean(),
      Product.countDocuments(filter)
    ]);
  }, [[], [], 0] as [unknown[], unknown[], number]);

  const products: ShopProduct[] = items.map((p: any) => mapProductListing(p, p.category?.slug || ''));
  const categoryItems = categories.map((c: any) => ({ slug: String(c.slug), name: String(c.name) }));
  const activeCategory = categoryItems.find((c) => c.slug === category);
  const activeUsage = PRODUCT_USAGE_OPTIONS.find((item) => item.value === usage);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const normalizedParams = {
    q: q || undefined,
    category: category || undefined,
    sort: sort !== 'newest' ? sort : undefined,
    usage: usage || undefined,
    minPrice: minPrice !== undefined ? String(minPrice) : undefined,
    maxPrice: maxPrice !== undefined ? String(maxPrice) : undefined,
    stock: stockOnly ? '1' : undefined,
    discount: discountOnly ? '1' : undefined,
    page: requestedPage > 1 ? String(requestedPage) : undefined
  };
  const activeFilters = [
    q ? { key: 'q', label: `جستجو: ${q}` } : null,
    category ? { key: 'category', label: activeCategory?.name || 'دسته نامعتبر' } : null,
    activeUsage ? { key: 'usage', label: activeUsage.label } : null,
    minPrice !== undefined ? { key: 'minPrice', label: `از ${minPrice.toLocaleString('fa-IR')} تومان` } : null,
    maxPrice !== undefined ? { key: 'maxPrice', label: `تا ${maxPrice.toLocaleString('fa-IR')} تومان` } : null,
    stockOnly ? { key: 'stock', label: 'فقط موجود' } : null,
    discountOnly ? { key: 'discount', label: 'تخفیف‌دار' } : null
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <main className="bg-[#fbfaf5]">
      <section className="relative isolate overflow-hidden bg-brand-900 text-white">
        <div className="organic-grid absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-[12%] h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <Container className="relative py-12 sm:py-16 lg:py-20">
          <nav className="flex items-center gap-2 text-[11px] font-bold text-brand-200">
            <Link href="/" className="transition hover:text-white">خانه</Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-accent-300">فروشگاه</span>
          </nav>
          <div className="mt-7 grid items-end gap-8 lg:grid-cols-[1fr_.82fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-bold text-brand-100 backdrop-blur"><Leaf className="h-3.5 w-3.5 text-accent-300" /> انتخابی از دل طبیعت</span>
              <h1 className="mt-4 text-3xl font-black leading-[1.4] tracking-tight sm:text-4xl lg:text-5xl">فروشگاه محصولات طبیعی</h1>
              <p className="mt-4 max-w-2xl text-sm leading-8 text-brand-100/70 sm:text-base">روغن‌های تازه، ادویه‌های خوش‌عطر و محصولات گیاهی اصیل؛ با انتخاب دقیق، بسته‌بندی حرفه‌ای و ارسال مطمئن.</p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-brand-100/70">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent-300" /> تضمین کیفیت</span>
                <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-accent-300" /> ارسال سراسر کشور</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-accent-300" /> انتخاب تازه</span>
              </div>
            </div>
            <form action="/products" className="rounded-[1.5rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl backdrop-blur-md sm:p-4">
              {category ? <input type="hidden" name="category" value={category} /> : null}
              {usage ? <input type="hidden" name="usage" value={usage} /> : null}
              {stockOnly ? <input type="hidden" name="stock" value="1" /> : null}
              {discountOnly ? <input type="hidden" name="discount" value="1" /> : null}
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
                <input name="q" defaultValue={q} placeholder="دنبال چه محصولی هستید؟" className="h-14 w-full rounded-2xl bg-white pr-12 pl-28 text-sm font-medium text-surface-900 outline-none ring-0 placeholder:text-surface-400 focus:shadow-[0_0_0_4px_rgba(201,133,70,0.22)] sm:h-16" />
                <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl bg-accent-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-accent-400 sm:px-5">جستجو</button>
              </div>
              <p className="mt-3 px-1 text-[10px] text-brand-100/55">نام محصول، ویژگی یا کاربرد موردنظر را جستجو کنید.</p>
            </form>
          </div>
        </Container>
      </section>

      {categoryItems.length ? (
        <div className="border-b border-surface-200 bg-white">
          <Container className="flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href={productsHref(normalizedParams, { category: undefined })} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${!category ? 'bg-brand-800 text-white shadow-md' : 'border border-surface-200 bg-surface-50 text-surface-600 hover:border-brand-300'}`}>همه محصولات</Link>
            {categoryItems.map((item) => (
              <Link key={item.slug} href={productsHref(normalizedParams, { category: item.slug })} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${category === item.slug ? 'bg-brand-800 text-white shadow-md' : 'border border-surface-200 bg-surface-50 text-surface-600 hover:border-brand-300 hover:text-brand-700'}`}>{item.name}</Link>
            ))}
          </Container>
        </div>
      ) : null}

      <Container className="py-8 sm:py-10 lg:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-accent-600">{activeCategory ? `دسته ${activeCategory.name}` : q ? 'نتیجه جستجو' : 'تمام محصولات'}</p>
            <h2 className="mt-1 text-xl font-black text-surface-900 sm:text-2xl">{q ? `نتایج برای «${q}»` : activeCategory?.name || 'انتخاب‌های تازه فروشگاه'}</h2>
          </div>
          <span className="rounded-full border border-surface-200 bg-white px-4 py-2 text-xs font-bold text-surface-500 shadow-soft">{total.toLocaleString('fa-IR')} محصول</span>
        </div>

        {activeFilters.length ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-surface-200 bg-white p-3 shadow-soft">
            <span className="px-1 text-[10px] font-black text-surface-400">فیلترهای فعال:</span>
            {activeFilters.map((filter) => (
              <Link key={filter.key} href={productsHref(normalizedParams, { [filter.key]: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[10px] font-black text-brand-800 transition hover:bg-rose-50 hover:text-rose-700">
                {filter.label}<X className="h-3 w-3" />
              </Link>
            ))}
            <Link href="/products" className="mr-auto px-2 text-[10px] font-black text-rose-600">حذف همه</Link>
          </div>
        ) : null}

        <details className="group mb-6 rounded-2xl border border-surface-200 bg-white shadow-soft lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-black text-surface-800 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-brand-700" /> فیلتر و مرتب‌سازی</span>
            <ChevronLeft className="h-4 w-4 transition group-open:-rotate-90" />
          </summary>
          <form action="/products" className="border-t border-surface-100 p-4">
            <StoreFilters categories={categoryItems} defaults={{ q, category, sort, usage, minPrice: minPrice !== undefined ? String(minPrice) : '', maxPrice: maxPrice !== undefined ? String(maxPrice) : '', stock: stockOnly, discount: discountOnly }} compact />
          </form>
        </details>

        <div className="grid gap-8 lg:grid-cols-[17.5rem_1fr]">
          <form action="/products" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            <StoreFilters categories={categoryItems} defaults={{ q, category, sort, usage, minPrice: minPrice !== undefined ? String(minPrice) : '', maxPrice: maxPrice !== undefined ? String(maxPrice) : '', stock: stockOnly, discount: discountOnly }} />
          </form>
          <section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.length ? products.map((p) => <StoreProductCard key={p.id} product={p} />) : (
                <StoreEmpty message="محصولی با این مشخصات پیدا نشد؛ فیلترها را تغییر دهید." />
              )}
            </div>
            <StorePagination currentPage={requestedPage} totalPages={totalPages} params={normalizedParams} />
          </section>
        </div>
      </Container>
    </main>
  );
}
