import { Order, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import type { HomeProductFilterType } from '@/lib/shop/home-product-sections';

export async function fetchProductsByHomeFilter(filterType: HomeProductFilterType, limit: number) {
  await connectToDatabase();
  const baseFilter = { isActive: true };

  switch (filterType) {
    case 'NEWEST':
      return Product.find(baseFilter).sort({ createdAt: -1 }).limit(limit).lean();
    case 'FEATURED':
      return Product.find({ ...baseFilter, isFeatured: true }).sort({ createdAt: -1 }).limit(limit).lean();
    case 'ON_SALE':
      return Product.find({ ...baseFilter, discountPrice: { $gt: 0 } }).sort({ updatedAt: -1 }).limit(limit).lean();
    case 'LOWEST_PRICE':
      return Product.find(baseFilter).sort({ discountPrice: 1, price: 1 }).limit(limit).lean();
    case 'HIGHEST_PRICE':
      return Product.find(baseFilter).sort({ discountPrice: -1, price: -1 }).limit(limit).lean();
    case 'HIGHEST_STOCK':
      return Product.find(baseFilter).sort({ stock: -1 }).limit(limit).lean();
    case 'EDIBLE':
      return Product.find({ ...baseFilter, usageType: { $in: ['EDIBLE', 'BOTH'] } }).sort({ createdAt: -1 }).limit(limit).lean();
    case 'NON_EDIBLE':
      return Product.find({ ...baseFilter, usageType: { $in: ['NON_EDIBLE', 'TOPICAL'] } }).sort({ createdAt: -1 }).limit(limit).lean();
    case 'RANDOM': {
      const count = await Product.countDocuments(baseFilter);
      const skip = count > limit ? Math.floor(Math.random() * Math.max(1, count - limit)) : 0;
      return Product.find(baseFilter).skip(skip).limit(limit).lean();
    }
    case 'BEST_SELLING': {
      const agg = await Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } },
        { $sort: { qty: -1 } },
        { $limit: limit * 2 }
      ]);
      const ids = agg.map((a) => a._id).filter(Boolean);
      if (!ids.length) {
        return Product.find(baseFilter).sort({ isFeatured: -1, createdAt: -1 }).limit(limit).lean();
      }
      const products = await Product.find({ ...baseFilter, _id: { $in: ids } }).lean();
      const rank = new Map(ids.map((id: unknown, i: number) => [String(id), i]));
      return products
        .sort((a, b) => (rank.get(String(a._id)) ?? 999) - (rank.get(String(b._id)) ?? 999))
        .slice(0, limit);
    }
    default:
      return Product.find(baseFilter).sort({ createdAt: -1 }).limit(limit).lean();
  }
}
