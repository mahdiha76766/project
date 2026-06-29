import mongoose from 'mongoose';
import { Product } from '@/models';
import {
  findVariant,
  getVariantUnitPrice,
  hasVariants,
  resolveVariantId,
  type ProductLike
} from '@/lib/product/variants';

type RawCartItem = {
  product: mongoose.Types.ObjectId | string | { _id?: unknown };
  variantId?: mongoose.Types.ObjectId | string | null;
  quantity: number;
  weight?: string;
  volume?: string;
};

export type SerializedCartItem = {
  product: {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    discountPrice?: number;
    images?: string[];
    weight?: number;
    weightUnit?: string;
    variants?: unknown[];
  };
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  hasVariants: boolean;
  quantity: number;
  weight?: string;
  volume?: string;
};

function productRefId(item: RawCartItem) {
  const p = item.product;
  if (!p) return '';
  if (typeof p === 'object' && p !== null && '_id' in p && p._id) return String(p._id);
  return String(p);
}

export async function serializeCartItems(items: RawCartItem[]): Promise<SerializedCartItem[]> {
  if (!items.length) return [];

  const productIds = [
    ...new Set(
      items
        .map(productRefId)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  ];

  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const serialized: SerializedCartItem[] = [];

  for (const item of items) {
    const refId = productRefId(item);
    const product = productMap.get(refId);
    if (!product) continue;

    const variantId = item.variantId ? String(item.variantId) : undefined;
    const variant = findVariant(product as ProductLike, variantId);

    serialized.push({
      product: {
        _id: String(product._id),
        name: String(product.name || ''),
        slug: product.slug,
        price: Number(product.price || 0),
        discountPrice: typeof product.discountPrice === 'number' ? product.discountPrice : undefined,
        images: product.images,
        weight: product.weight,
        weightUnit: product.weightUnit,
        variants: product.variants
      },
      variantId,
      variantName: variant?.name,
      unitPrice: getVariantUnitPrice(variant!),
      hasVariants: hasVariants(product as ProductLike),
      quantity: Number(item.quantity || 1),
      weight: item.weight,
      volume: item.volume
    });
  }

  return serialized;
}

export function cartItemsCount(items: SerializedCartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function normalizeCartVariantId(variant: Parameters<typeof resolveVariantId>[0]) {
  const id = resolveVariantId(variant);
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return undefined;
  return id;
}
