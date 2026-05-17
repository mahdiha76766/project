import type { ShopProduct } from '@/types/shop';

export interface ProductFilterParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  type?: string;
  temperament?: string;
  sort?: 'newest' | 'best_selling' | 'cheapest' | 'expensive';
}

export const filterProducts = (items: ShopProduct[], params: ProductFilterParams): ShopProduct[] => {
  let output = [...items];

  if (params.q) {
    const q = params.q.toLowerCase();
    output = output.filter((item) => {
      const haystack = [
        item.name,
        item.shortDescription,
        item.fullDescription,
        item.category,
        item.tags.join(' '),
        Object.values(item.attributes).join(' ')
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (params.category) output = output.filter((p) => p.category === params.category);
  if (typeof params.minPrice === 'number') output = output.filter((p) => (p.discountPrice ?? p.price) >= params.minPrice!);
  if (typeof params.maxPrice === 'number') output = output.filter((p) => (p.discountPrice ?? p.price) <= params.maxPrice!);
  if (params.inStock) output = output.filter((p) => p.stock > 0);
  if (params.type) output = output.filter((p) => p.type === params.type);
  if (params.temperament) output = output.filter((p) => p.temperament === params.temperament);

  if (params.sort === 'cheapest') output.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
  if (params.sort === 'expensive') output.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
  if (params.sort === 'best_selling') output.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
  if (params.sort === 'newest') output.sort((a, b) => Number(b.id) - Number(a.id));

  return output;
};
