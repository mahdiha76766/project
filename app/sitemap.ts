import type { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { BlogPost } from '@/models/SupportModels';
import { absoluteUrl } from '@/lib/seo/site-url';

function toLastModified(value?: Date | string | null) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/pharmaceutical'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/herbal'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/supplements'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/categories'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/research'), lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/downloads'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/search'), lastModified: now, changeFrequency: 'weekly', priority: 0.4 },
  ];

  try {
    await connectToDatabase();

    const [products, categories, blogPosts] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
      BlogPost.find({ isPublished: true }).select('slug updatedAt publishedAt').lean()
    ]);

    const productRoutes: MetadataRoute.Sitemap = products
      .filter((p) => p.slug)
      .map((p) => ({
        url: absoluteUrl(`/products/${p.slug}`),
        lastModified: toLastModified(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7
      }));

    const categoryRoutes: MetadataRoute.Sitemap = categories
      .filter((c) => c.slug)
      .map((c) => ({
        url: absoluteUrl(`/categories/${c.slug}`),
        lastModified: toLastModified(c.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6
      }));

    const blogRoutes: MetadataRoute.Sitemap = blogPosts
      .filter((b) => b.slug)
      .map((b) => ({
        url: absoluteUrl(`/blog/${b.slug}`),
        lastModified: toLastModified(b.updatedAt ?? b.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7
      }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
