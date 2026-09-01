import type { ShopProduct } from '@/types/shop';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';

export const ProductCard = ({ product }: { product: ShopProduct }) => (
  <FeedarProductCard product={product} />
);
