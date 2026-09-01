import { BlogPost, Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { mapProductListing } from '@/lib/shop/map-product-listing';

export async function searchPublicSite(q: string) {
  const query = q.trim();
  if (query.length < 2) {
    return { products: [], articles: [], categories: [] };
  }
  const rx = { $regex: query, $options: 'i' };

  return withDatabase(async () => {
    const [products, articles, categories] = await Promise.all([
      Product.find({
        isActive: true,
        $or: [{ name: rx }, { shortDescription: rx }, { tags: rx }]
      })
        .limit(8)
        .populate('category', 'name slug')
        .lean(),
      BlogPost.find({
        isPublished: true,
        $or: [{ title: rx }, { excerpt: rx }, { category: rx }]
      })
        .limit(8)
        .lean(),
      Category.find({ isActive: true, $or: [{ name: rx }, { slug: rx }, { description: rx }] })
        .limit(8)
        .lean()
    ]);

    return {
      products: products.map((p: Record<string, unknown>) =>
        mapProductListing(p, (p.category as { name?: string } | undefined)?.name || '')
      ),
      articles: articles.map((p: Record<string, unknown>) => ({
        slug: String(p.slug),
        title: String(p.title),
        excerpt: String(p.excerpt || ''),
        coverImage: p.coverImage as string | undefined,
        category: String(p.category || '')
      })),
      categories: categories.map((c: Record<string, unknown>) => ({
        slug: String(c.slug),
        name: String(c.name),
        description: String(c.description || ''),
        image: String(c.image || '')
      }))
    };
  }, { products: [], articles: [], categories: [] });
}
