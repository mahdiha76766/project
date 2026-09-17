import type { HomeProduct } from '@/lib/shop/home-types';

export type ShelfSort = 'newest' | 'best_selling' | 'featured' | 'on_sale';
export type ShelfLayout = 'rail' | 'grid' | 'spotlight';
export type ShelfTone = 'brand' | 'accent' | 'emerald' | 'rose' | 'muted';

export type CategoryShelfQuery = {
  id: string;
  title: string;
  description?: string;
  label: string;
  category?: string;
  sort?: ShelfSort;
  limit?: number;
  layout?: ShelfLayout;
  tone?: ShelfTone;
  usage?: Array<'EDIBLE' | 'NON_EDIBLE' | 'TOPICAL' | 'BOTH'>;
};

export type CategoryShelf = {
  id: string;
  title: string;
  description?: string;
  label: string;
  category?: string;
  categoryName?: string;
  sort: ShelfSort;
  layout: ShelfLayout;
  tone: ShelfTone;
  viewAllHref: string;
  products: HomeProduct[];
};
