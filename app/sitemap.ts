import type { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { BlogPost } from '@/models/SupportModels';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nabsara.ir';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  try {
    await connectToDatabase();

    const [products, categories, blogPosts] = await Promise.all([
      Product.find({ isActive: true }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
      BlogPost.find({ isPublished: true }).select('slug updatedAt publishedAt').lean(),
    ]);

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((b) => ({
      url: `${BASE_URL}/blog/${b.slug}`,
      lastModified: b.updatedAt ?? b.publishedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
