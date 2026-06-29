import type { ShopProduct } from '@/types/shop';
import { StoreProductCard } from '@/components/shop/store/StoreProductCard';

export const ProductCard = ({ product }: { product: ShopProduct }) => (
  <StoreProductCard product={product} />
);
