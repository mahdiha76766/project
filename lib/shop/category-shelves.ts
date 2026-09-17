import 'server-only';

import { Category, Order, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { withAvailableProducts } from '@/lib/shop/available-products';
import { mapHomeProduct } from '@/lib/shop/map-home-product';
import type { CategoryShelf, CategoryShelfQuery, ShelfLayout, ShelfSort, ShelfTone } from '@/lib/shop/shelf-types';

export type { CategoryShelf, CategoryShelfQuery, ShelfLayout, ShelfSort, ShelfTone } from '@/lib/shop/shelf-types';

type CategoryRow = {
  _id: unknown;
  name: string;
  slug: string;
  description?: string;
  count: number;
};

function viewAllHref(opts: {
  category?: string;
  sort: ShelfSort;
  usage?: string[];
}): string {
  const params = new URLSearchParams();
  if (opts.category) params.set('category', opts.category);
  if (opts.usage?.includes('EDIBLE')) params.set('usage', 'EDIBLE');
  if (opts.usage?.includes('TOPICAL') || opts.usage?.includes('NON_EDIBLE')) params.set('usage', 'TOPICAL');
  if (opts.sort === 'newest') params.set('sort', 'newest');
  if (opts.sort === 'best_selling' || opts.sort === 'featured') params.set('sort', 'best_selling');
  if (opts.sort === 'on_sale') params.set('discount', '1');
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}

async function fetchBestSellingIds(limit: number): Promise<{ ids: unknown[]; qtyById: Map<string, number> }> {
  const agg = await Order.aggregate([
    { $match: { paymentStatus: 'PAID' } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
    { $sort: { qty: -1 } },
    { $limit: Math.max(limit * 6, 40) }
  ]);
  const ids = agg.map((a) => a._id).filter(Boolean);
  const qtyById = new Map(agg.map((a) => [String(a._id), Number(a.qty || 0)]));
  return { ids, qtyById };
}

async function fetchShelfProducts(opts: {
  categoryId?: string;
  sort: ShelfSort;
  limit: number;
  usage?: string[];
  bestSelling?: { ids: unknown[]; qtyById: Map<string, number> };
}): Promise<Record<string, unknown>[]> {
  const base: Record<string, unknown> = {};
  if (opts.categoryId) base.category = opts.categoryId;
  if (opts.usage?.length) base.usageType = { $in: opts.usage };

  switch (opts.sort) {
    case 'newest':
      return Product.find(withAvailableProducts(base)).sort({ createdAt: -1 }).limit(opts.limit).lean() as Promise<
        Record<string, unknown>[]
      >;
    case 'featured':
      return Product.find(withAvailableProducts({ ...base, isFeatured: true }))
        .sort({ createdAt: -1 })
        .limit(opts.limit)
        .lean() as Promise<Record<string, unknown>[]>;
    case 'on_sale':
      return Product.find(
        withAvailableProducts({
          ...base,
          $or: [{ discountPrice: { $gt: 0 } }, { 'variants.discountPrice': { $gt: 0 } }]
        })
      )
        .sort({ updatedAt: -1 })
        .limit(opts.limit)
        .lean() as Promise<Record<string, unknown>[]>;
    case 'best_selling': {
      const { ids, qtyById } = opts.bestSelling || (await fetchBestSellingIds(opts.limit));
      if (!ids.length) {
        return Product.find(withAvailableProducts(base))
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(opts.limit)
          .lean() as Promise<Record<string, unknown>[]>;
      }
      const products = (await Product.find(withAvailableProducts({ ...base, _id: { $in: ids } })).lean()) as Record<
        string,
        unknown
      >[];
      const rank = new Map(ids.map((id, i) => [String(id), i]));
      return products
        .sort((a, b) => (rank.get(String(a._id)) ?? 999) - (rank.get(String(b._id)) ?? 999))
        .slice(0, opts.limit)
        .map((p) => ({ ...p, soldCount: qtyById.get(String(p._id)) || 0 }));
    }
    default:
      return Product.find(withAvailableProducts(base)).sort({ createdAt: -1 }).limit(opts.limit).lean() as Promise<
        Record<string, unknown>[]
      >;
  }
}

/** Resolve a single declarative shelf query into products (available-only). */
export async function fetchCategoryShelf(query: CategoryShelfQuery): Promise<CategoryShelf | null> {
  await connectToDatabase();
  const sort = query.sort || 'newest';
  const limit = Math.min(24, Math.max(4, query.limit ?? 8));
  const layout = query.layout || 'rail';
  const tone = query.tone || 'brand';

  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categorySlug = query.category;

  if (query.category) {
    const cat = (await Category.findOne({ slug: query.category, isActive: true }).lean()) as
      | { _id: unknown; name: string; slug: string; description?: string }
      | null;
    if (!cat) return null;
    categoryId = String(cat._id);
    categoryName = cat.name;
    categorySlug = cat.slug;
  }

  const raw = await fetchShelfProducts({
    categoryId,
    sort,
    limit,
    usage: query.usage
  });

  if (!raw.length) return null;

  const title =
    query.title ||
    (categoryName
      ? sort === 'best_selling'
        ? `پرفروش‌ترین ${categoryName}`
        : `جدیدترین ${categoryName}`
      : 'محصولات منتخب');

  return {
    id: query.id,
    title,
    description: query.description,
    label: query.label,
    category: categorySlug,
    categoryName,
    sort,
    layout,
    tone,
    viewAllHref: viewAllHref({ category: categorySlug, sort, usage: query.usage }),
    products: raw.map(mapHomeProduct)
  };
}

/**
 * Build Digikala-style category merchandising shelves from live catalog data.
 * One bestseller aggregation is shared across shelves for performance.
 */
export async function buildHomeCategoryShelves(options?: {
  maxCategories?: number;
  productsPerShelf?: number;
}): Promise<CategoryShelf[]> {
  await connectToDatabase();
  const maxCategories = options?.maxCategories ?? 5;
  const limit = options?.productsPerShelf ?? 8;

  const [countRows, bestSelling] = await Promise.all([
    Product.aggregate([
      { $match: withAvailableProducts({ category: { $ne: null } }) },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: maxCategories + 4 }
    ]) as Promise<Array<{ _id: unknown; count: number }>>,
    fetchBestSellingIds(limit)
  ]);

  const countMap = new Map(countRows.map((row) => [String(row._id), Number(row.count || 0)]));
  const categoryIds = countRows.map((row) => row._id).filter(Boolean);
  const categoryDocs = categoryIds.length
    ? ((await Category.find({ _id: { $in: categoryIds }, isActive: true })
        .select('name slug description')
        .lean()) as unknown as Array<{ _id: unknown; name: string; slug: string; description?: string }>)
    : [];

  const cats: CategoryRow[] = categoryDocs
    .map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      count: countMap.get(String(cat._id)) || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxCategories);

  if (!cats.length) return [];

  const tones: ShelfTone[] = ['brand', 'emerald', 'accent', 'rose', 'muted'];

  const shelfJobs: Array<Promise<CategoryShelf | null>> = [];

  // Newest-by-category for each top category
  cats.forEach((cat, index) => {
    shelfJobs.push(
      (async () => {
        const raw = await fetchShelfProducts({
          categoryId: String(cat._id),
          sort: 'newest',
          limit,
          bestSelling
        });
        if (raw.length < 2) return null;
        return {
          id: `shelf-newest-${cat.slug}`,
          title: `جدیدترین ${cat.name}`,
          description: cat.description?.trim() || undefined,
          label: 'تازه در دسته',
          category: cat.slug,
          categoryName: cat.name,
          sort: 'newest' as const,
          layout: (index % 3 === 1 ? 'grid' : 'rail') as ShelfLayout,
          tone: tones[index % tones.length],
          viewAllHref: viewAllHref({ category: cat.slug, sort: 'newest' }),
          products: raw.map(mapHomeProduct)
        };
      })()
    );
  });

  // Best-selling shelves for the top 2 categories
  cats.slice(0, 2).forEach((cat, index) => {
    shelfJobs.push(
      (async () => {
        const raw = await fetchShelfProducts({
          categoryId: String(cat._id),
          sort: 'best_selling',
          limit,
          bestSelling
        });
        if (raw.length < 2) return null;
        return {
          id: `shelf-best-${cat.slug}`,
          title: `پرفروش‌ترین ${cat.name}`,
          description: 'محبوب‌ترین انتخاب‌ها در این دسته',
          label: 'پرفروش دسته',
          category: cat.slug,
          categoryName: cat.name,
          sort: 'best_selling' as const,
          layout: (index === 0 ? 'spotlight' : 'rail') as ShelfLayout,
          tone: 'accent',
          viewAllHref: viewAllHref({ category: cat.slug, sort: 'best_selling' }),
          products: raw.map(mapHomeProduct)
        };
      })()
    );
  });

  // Featured / specials in top category
  if (cats[0]) {
    const top = cats[0];
    shelfJobs.push(
      (async () => {
        const raw = await fetchShelfProducts({
          categoryId: String(top._id),
          sort: 'featured',
          limit,
          bestSelling
        });
        if (raw.length < 2) return null;
        return {
          id: `shelf-featured-${top.slug}`,
          title: `محصولات ویژه ${top.name}`,
          description: 'منتخب‌های ویژه این دسته',
          label: 'ویژه',
          category: top.slug,
          categoryName: top.name,
          sort: 'featured' as const,
          layout: 'grid' as const,
          tone: 'muted',
          viewAllHref: viewAllHref({ category: top.slug, sort: 'featured' }),
          products: raw.map(mapHomeProduct)
        };
      })()
    );
  }

  // Popular edible recommendations (usage-based, not category-hardcoded)
  shelfJobs.push(
    (async () => {
      const raw = await fetchShelfProducts({
        sort: 'best_selling',
        limit,
        usage: ['EDIBLE', 'BOTH'],
        bestSelling
      });
      if (raw.length < 2) return null;
      return {
        id: 'shelf-popular-edible',
        title: 'پرفروش‌ترین خوراکی‌ها',
        description: 'پیشنهادهای محبوب کاربران در دسته خوراکی',
        label: 'پیشنهاد کاربران',
        sort: 'best_selling' as const,
        layout: 'rail' as const,
        tone: 'rose',
        viewAllHref: viewAllHref({ sort: 'best_selling', usage: ['EDIBLE'] }),
        products: raw.map(mapHomeProduct)
      };
    })()
  );

  // On-sale shelf if discounts exist
  shelfJobs.push(
    (async () => {
      const raw = await fetchShelfProducts({
        sort: 'on_sale',
        limit,
        bestSelling
      });
      if (raw.length < 2) return null;
      return {
        id: 'shelf-on-sale',
        title: 'پیشنهادهای ویژه',
        description: 'محصولات تخفیف‌دار موجود',
        label: 'تخفیف',
        sort: 'on_sale' as const,
        layout: 'grid' as const,
        tone: 'rose',
        viewAllHref: viewAllHref({ sort: 'on_sale' }),
        products: raw.map(mapHomeProduct)
      };
    })()
  );

  const results = await Promise.all(shelfJobs);
  const seen = new Set<string>();
  const shelves: CategoryShelf[] = [];

  for (const shelf of results) {
    if (!shelf || seen.has(shelf.id)) continue;
    seen.add(shelf.id);
    shelves.push(shelf);
  }

  // Prefer diversity: newest shelves first, then bestsellers, then specials
  const order = (s: CategoryShelf) => {
    if (s.id.startsWith('shelf-newest')) return 0;
    if (s.id.startsWith('shelf-best')) return 1;
    if (s.id === 'shelf-popular-edible') return 2;
    if (s.id.startsWith('shelf-featured')) return 3;
    if (s.id === 'shelf-on-sale') return 4;
    return 5;
  };

  return shelves.sort((a, b) => order(a) - order(b));
}
