import 'server-only';

import { connectToDatabase } from '@/lib/db/mongoose';
import { PriceHistory, PriceSaveMeta } from '@/models/PriceHistory';

function variantKey(variantId?: string | null) {
  return String(variantId || '').trim();
}

export type PriceHistoryItem = {
  id: string;
  price: number;
  discountPrice: number | null;
  savedAt: string;
  productName: string;
  variantLabel: string;
};

export async function recordPriceHistoryEntry(input: {
  productId: string;
  variantId?: string | null;
  productName: string;
  variantLabel: string;
  previousPrice: number;
  previousDiscountPrice?: number | null;
  newPrice: number;
  newDiscountPrice?: number | null;
  /** Fallback when no prior save meta exists (e.g. product.updatedAt) */
  previousSavedAtFallback?: Date | string | null;
}) {
  await connectToDatabase();

  const productId = String(input.productId).trim();
  const variantId = variantKey(input.variantId);
  const prev = Math.max(0, Number(input.previousPrice || 0));
  const next = Math.max(0, Number(input.newPrice || 0));
  const prevDisc =
    input.previousDiscountPrice != null && Number(input.previousDiscountPrice) > 0
      ? Number(input.previousDiscountPrice)
      : null;
  const nextDisc =
    input.newDiscountPrice != null && Number(input.newDiscountPrice) > 0
      ? Number(input.newDiscountPrice)
      : null;

  if (prev === next && prevDisc === nextDisc) {
    return { recorded: false as const };
  }

  const meta = (await PriceSaveMeta.findOne({ productId, variantId }).lean()) as {
    savedAt?: Date;
  } | null;

  let savedAt: Date;
  if (meta?.savedAt instanceof Date) {
    savedAt = meta.savedAt;
  } else if (input.previousSavedAtFallback) {
    const parsed = new Date(input.previousSavedAtFallback);
    savedAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    savedAt = new Date();
  }

  await PriceHistory.create({
    productId,
    variantId,
    productName: input.productName,
    variantLabel: input.variantLabel,
    price: prev,
    discountPrice: prevDisc,
    savedAt
  });

  await PriceSaveMeta.findOneAndUpdate(
    { productId, variantId },
    {
      $set: {
        price: next,
        discountPrice: nextDisc,
        savedAt: new Date()
      }
    },
    { upsert: true }
  );

  return { recorded: true as const };
}

export async function listPriceHistory(input: {
  productId: string;
  variantId?: string | null;
  limit?: number;
}): Promise<PriceHistoryItem[]> {
  await connectToDatabase();
  const productId = String(input.productId).trim();
  const variantId = variantKey(input.variantId);
  const limit = Math.min(Math.max(Number(input.limit) || 40, 1), 100);

  const rows = await PriceHistory.find({ productId, variantId })
    .sort({ savedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return rows.map((r: any) => ({
    id: String(r._id),
    price: Number(r.price || 0),
    discountPrice:
      typeof r.discountPrice === 'number' && r.discountPrice > 0 ? r.discountPrice : null,
    savedAt: new Date(r.savedAt || r.createdAt).toISOString(),
    productName: String(r.productName || ''),
    variantLabel: String(r.variantLabel || '')
  }));
}
