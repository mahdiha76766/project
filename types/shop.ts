export type ProductType = 'oil' | 'spice' | 'herbal' | 'distillate' | 'tea' | 'tahini_syrup' | 'special' | 'gift' | 'bulk';

export interface ShopCategory {
  name: string;
  slug: string;
  description: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  images: string[];
  price: number;
  discountPrice?: number;
  stock: number;
  type: ProductType;
  tags: string[];
  attributes: Record<string, string>;
  weightOptions?: string[];
  volumeOptions?: string[];
  temperament?: string;
  featured?: boolean;
  bestSeller?: boolean;
  freshPressed?: boolean;
  popularSpice?: boolean;
  productionDate?: string;
  expiryDate?: string;
}
