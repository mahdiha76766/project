import type { MetadataRoute } from 'next';
import { products, storeCategories, blogPosts } from '@/lib/data/shop-data';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/products', '/categories', '/blog'].map((path) => ({ url: `${BASE_URL}${path}`, lastModified: new Date() }));
  const productRoutes = products.map((p) => ({ url: `${BASE_URL}/products/${p.slug}`, lastModified: new Date() }));
  const categoryRoutes = storeCategories.map((c) => ({ url: `${BASE_URL}/categories/${c.slug}`, lastModified: new Date() }));
  const blogRoutes = blogPosts.map((b) => ({ url: `${BASE_URL}/blog/${b.slug}`, lastModified: new Date() }));
  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...blogRoutes];
}
