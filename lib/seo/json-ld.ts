import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url';
import { resolveOgImage, SITE_BRAND_NAME, SITE_CONTENT_TEAM } from '@/lib/seo/resolve-og-image';
import { getProductVariants } from '@/lib/product/variants';

export type BreadcrumbItem = { name: string; path?: string };

function isoDate(value?: Date | string | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {})
    }))
  };
}

export function buildBlogPostingJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string;
  seoMetaDescription?: string;
  coverImage?: string;
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  const canonical = absoluteUrl(`/blog/${post.slug}`);
  const description =
    post.seoMetaDescription?.trim() ||
    post.excerpt?.trim() ||
    post.title;

  return {
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: post.coverImage ? [resolveOgImage(post.coverImage)] : undefined,
    datePublished: isoDate(post.publishedAt),
    dateModified: isoDate(post.updatedAt || post.publishedAt),
    author: {
      '@type': 'Organization',
      name: SITE_CONTENT_TEAM
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_BRAND_NAME,
      url: getSiteUrl()
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical
    },
    inLanguage: 'fa-IR',
    url: canonical
  };
}

function effectiveProductPrice(product: {
  price?: number;
  discountPrice?: number;
  variants?: Array<{ price?: number; discountPrice?: number; isDefault?: boolean }>;
}): number | null {
  const variants = getProductVariants(product as never);
  const def = variants.find((v) => v.isDefault) || variants[0];
  const raw =
    def?.discountPrice && def.discountPrice > 0
      ? def.discountPrice
      : def?.price ?? product.discountPrice ?? product.price;
  const price = Number(raw || 0);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function productStock(product: { stock?: number; variants?: Array<{ stock?: number }> }): number {
  const variants = getProductVariants(product as never);
  if (variants.length) {
    return variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
  }
  return Number(product.stock || 0);
}

/** DB prices are stored in Toman; schema.org IRR expects Rial (×10). */
function tomanToIrr(toman: number): number {
  return Math.round(toman * 10);
}

export function buildProductJsonLd(product: {
  name: string;
  slug: string;
  shortDescription?: string;
  seo?: { description?: string };
  images?: string[];
  sku?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  variants?: Array<{ price?: number; discountPrice?: number; stock?: number; sku?: string; isDefault?: boolean }>;
  updatedAt?: Date | string | null;
}) {
  const canonical = absoluteUrl(`/products/${product.slug}`);
  const description = product.seo?.description?.trim() || product.shortDescription?.trim() || product.name;
  const images = (product.images || []).filter(Boolean).map((img) => resolveOgImage(img));
  const variants = getProductVariants(product as never);
  const sku = product.sku || variants.find((v) => v.sku)?.sku;
  const priceToman = effectiveProductPrice(product);
  const stock = productStock(product);

  const offers =
    priceToman != null
      ? {
          '@type': 'Offer',
          url: canonical,
          priceCurrency: 'IRR',
          price: tomanToIrr(priceToman),
          availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition'
        }
      : undefined;

  return {
    '@type': 'Product',
    name: product.name,
    description,
    image: images.length ? images : undefined,
    sku: sku || undefined,
    brand: {
      '@type': 'Brand',
      name: SITE_BRAND_NAME
    },
    ...(offers ? { offers } : {}),
    url: canonical
  };
}

export function buildPageJsonLd(...nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes
  };
}
