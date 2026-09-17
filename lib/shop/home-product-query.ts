import { Order, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { withAvailableProducts } from '@/lib/shop/available-products';
import type { HomeProductFilterType } from '@/lib/shop/home-product-sections';

export async function fetchProductsByHomeFilter(filterType: HomeProductFilterType, limit: number) {
  await connectToDatabase();
  const available = () => withAvailableProducts();

  switch (filterType) {
    case 'NEWEST':
      return Product.find(available()).sort({ createdAt: -1 }).limit(limit).lean();
    case 'FEATURED':
      return Product.find(withAvailableProducts({ isFeatured: true })).sort({ createdAt: -1 }).limit(limit).lean();
    case 'ON_SALE':
      return Product.find(
        withAvailableProducts({
          $or: [{ discountPrice: { $gt: 0 } }, { 'variants.discountPrice': { $gt: 0 } }]
        })
      )
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
    case 'LOWEST_PRICE':
      return Product.find(available()).sort({ discountPrice: 1, price: 1 }).limit(limit).lean();
    case 'HIGHEST_PRICE':
      return Product.find(available()).sort({ discountPrice: -1, price: -1 }).limit(limit).lean();
    case 'HIGHEST_STOCK':
      return Product.find(available()).sort({ stock: -1 }).limit(limit).lean();
    case 'EDIBLE':
      return Product.find(withAvailableProducts({ usageType: { $in: ['EDIBLE', 'BOTH'] } }))
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    case 'NON_EDIBLE':
      return Product.find(withAvailableProducts({ usageType: { $in: ['NON_EDIBLE', 'TOPICAL'] } }))
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    case 'RANDOM': {
      const base = available();
      const count = await Product.countDocuments(base);
      const skip = count > limit ? Math.floor(Math.random() * Math.max(1, count - limit)) : 0;
      return Product.find(base).skip(skip).limit(limit).lean();
    }
    case 'BEST_SELLING': {
      const agg = await Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: limit * 4 }
      ]);
      const ids = agg.map((a) => a._id).filter(Boolean);
      const qtyById = new Map(agg.map((a) => [String(a._id), Number(a.qty || 0)]));
      if (!ids.length) {
        const featured = await Product.find(available()).sort({ isFeatured: -1, createdAt: -1 }).limit(limit).lean();
        return featured.map((p) => ({ ...p, soldCount: 0 }));
      }
      const products = await Product.find(withAvailableProducts({ _id: { $in: ids } })).lean();
      const rank = new Map(ids.map((id: unknown, i: number) => [String(id), i]));
      return products
        .sort((a, b) => (rank.get(String(a._id)) ?? 999) - (rank.get(String(b._id)) ?? 999))
        .slice(0, limit)
        .map((p) => ({ ...p, soldCount: qtyById.get(String(p._id)) || 0 }));
    }
    default:
      return Product.find(available()).sort({ createdAt: -1 }).limit(limit).lean();
  }
}
