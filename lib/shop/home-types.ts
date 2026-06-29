export type HomeProductVariant = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  isDefault?: boolean;
};

export type HomeProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  bestSeller?: boolean;
  hasVariants?: boolean;
  discountLabel?: string;
  minPrice?: number;
  defaultVariantId?: string;
  variants?: HomeProductVariant[];
};

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
};

export type HomeBanner = {
  id: string;
  title: string;
  image: string;
  link?: string;
};

export type HomeBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  views?: number;
};

export type { HeroSlide as HomeHeroSlide } from '@/lib/admin/slider-config';
