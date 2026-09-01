import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import type { ShopProduct } from '@/types/shop';
import {
  FEEDAR_PRODUCT_LINES,
  type FeedarProductLine
} from '@/lib/brand/feedar';

export function productLineMongoFilter(line: FeedarProductLine) {
  const meta = FEEDAR_PRODUCT_LINES[line];
  return {
    isActive: true,
    $or: [{ productLine: line }, { tags: { $in: meta.tags } }]
  };
}

export async function fetchProductsByLine(
  line: FeedarProductLine,
  limit = 24
): Promise<ShopProduct[]> {
  const items = await withDatabase(async () => {
    return Product.find(productLineMongoFilter(line))
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'slug')
      .lean();
  }, [] as Record<string, unknown>[]);

  return items.map((p: Record<string, unknown>) =>
    mapProductListing(p, (p.category as { slug?: string } | undefined)?.slug || '')
  );
}

export async function fetchFeaturedStoreProducts(limit = 8): Promise<ShopProduct[]> {
  const items = await withDatabase(async () => {
    return Product.find({ isActive: true })
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .populate('category', 'slug name')
      .lean();
  }, [] as Record<string, unknown>[]);

  return items.map((p: Record<string, unknown>) =>
    mapProductListing(p, (p.category as { name?: string; slug?: string } | undefined)?.name || (p.category as { slug?: string } | undefined)?.slug || '')
  );
}

const PAGE_SIZE = 12;

export async function queryPublicCatalog(input: {
  q?: string;
  category?: string;
  line?: string;
  sort?: string;
  page?: number;
}) {
  const page = Math.max(1, Number(input.page || 1));
  const q = String(input.q || '').trim();
  const category = String(input.category || '').trim();
  const line = String(input.line || '').trim().toUpperCase();
  const sort = String(input.sort || 'newest');

  return withDatabase(async () => {
    const and: Record<string, unknown>[] = [{ isActive: true }];
    if (category) {
      const found = await Category.findOne({ slug: category, isActive: true }).select('_id').lean() as { _id?: unknown } | null;
      and.push({ category: found?._id || null });
    }
    if (line === 'PHARMACEUTICAL' || line === 'HERBAL' || line === 'SUPPLEMENT') {
      const meta = FEEDAR_PRODUCT_LINES[line];
      and.push({ $or: [{ productLine: line }, { tags: { $in: meta.tags } }] });
    }
    if (q) {
      and.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { shortDescription: { $regex: q, $options: 'i' } },
          { fullDescription: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      });
    }
    const filter = and.length === 1 ? and[0] : { $and: and };

    const sortObj: Record<string, 1 | -1> =
      sort === 'name' ? { name: 1 }
      : sort === 'best_selling' ? { isFeatured: -1, createdAt: -1 }
      : { createdAt: -1 };

    const skip = (page - 1) * PAGE_SIZE;
    const [items, total, categories] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(PAGE_SIZE).populate('category', 'slug name').lean(),
      Product.countDocuments(filter),
      Category.find({ isActive: true }).sort({ name: 1 }).select('slug name').lean()
    ]);

    return {
      products: items.map((p: Record<string, unknown>) =>
        mapProductListing(p, (p.category as { name?: string; slug?: string } | undefined)?.name || (p.category as { slug?: string } | undefined)?.slug || '')
      ),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      categories: (categories as unknown as Array<{ slug: string; name: string }>).map((c) => ({ slug: c.slug, name: c.name }))
    };
  }, { products: [] as ShopProduct[], total: 0, page: 1, pageCount: 1, categories: [] as Array<{ slug: string; name: string }> });
}
