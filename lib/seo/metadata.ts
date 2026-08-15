import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/seo/site-url';
import { resolveOgImage, SITE_BRAND_NAME } from '@/lib/seo/resolve-og-image';

export const NOINDEX_ROBOTS: Metadata['robots'] = { index: false, follow: false };
export const NOINDEX_FOLLOW_ROBOTS: Metadata['robots'] = { index: false, follow: true };
export const INDEX_ROBOTS: Metadata['robots'] = { index: true, follow: true };

export function privatePageMetadata(): Metadata {
  return {
    robots: NOINDEX_ROBOTS,
    // Clear root layout canonical/OG so private URLs never look like the homepage.
    alternates: { canonical: null },
    openGraph: null,
    twitter: null
  };
}

export function notFoundMetadata(title = 'یافت نشد'): Metadata {
  return {
    title,
    robots: NOINDEX_ROBOTS,
    alternates: { canonical: null },
    openGraph: null,
    twitter: null
  };
}

export type PublicMetadataInput = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: Metadata['robots'];
  ogType?: 'website' | 'article';
  image?: string | null;
  images?: string[];
};

export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const canonicalPath = input.canonicalPath;
  const canonical = absoluteUrl(canonicalPath);
  const robots = input.robots ?? INDEX_ROBOTS;
  const ogImages = (input.images?.length ? input.images : input.image ? [input.image] : [])
    .filter(Boolean)
    .map((img) => resolveOgImage(img!));

  const openGraphImages = ogImages.length
    ? ogImages.map((url) => ({ url, width: 1200, height: 630, alt: input.title }))
    : [{ url: resolveOgImage('/og-default.jpg'), width: 1200, height: 630, alt: SITE_BRAND_NAME }];

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots,
    openGraph: {
      type: input.ogType || 'website',
      locale: 'fa_IR',
      url: canonical,
      siteName: SITE_BRAND_NAME,
      title: input.title,
      description: input.description,
      images: openGraphImages
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: openGraphImages.map((img) => img.url)
    }
  };
}

export function buildMetadata(
  title: string,
  description: string,
  options?: { canonical?: string; robots?: Metadata['robots'] }
): Metadata {
  if (!options?.canonical) {
    return buildPublicMetadata({ title, description, canonicalPath: '/', robots: options?.robots });
  }
  return buildPublicMetadata({
    title,
    description,
    canonicalPath: options.canonical,
    robots: options?.robots
  });
}

export function hasListQueryParams(params: Record<string, string | string[] | undefined>): boolean {
  const q = String(params.q || '').trim();
  const category = String(params.category || '').trim();
  const sort = String(params.sort || '').trim();
  return Boolean(q || category || (sort && sort !== 'newest'));
}

export function buildQueryListMetadata(
  title: string,
  description: string,
  listPath: string,
  params: Record<string, string | string[] | undefined>
): Metadata {
  if (hasListQueryParams(params)) {
    return buildPublicMetadata({
      title,
      description,
      canonicalPath: listPath,
      robots: NOINDEX_FOLLOW_ROBOTS
    });
  }
  return buildPublicMetadata({ title, description, canonicalPath: listPath });
}

export function buildDetailMetadata(input: {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: 'website' | 'article';
  image?: string | null;
  images?: string[];
}): Metadata {
  return buildPublicMetadata({
    title: input.title,
    description: input.description,
    canonicalPath: input.canonicalPath,
    ogType: input.ogType,
    image: input.image,
    images: input.images
  });
}
