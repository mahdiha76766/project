import { Schema, model, models } from 'mongoose';

/** Snapshot of a price that was replaced — shown in price-portal history modal. */
const PriceHistorySchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    variantId: { type: String, default: '', index: true },
    productName: { type: String, default: '' },
    variantLabel: { type: String, default: '' },
    /** Previous price (toman) that was active before the change */
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    /** When that previous price was originally saved / became active */
    savedAt: { type: Date, required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PriceHistorySchema.index({ productId: 1, variantId: 1, savedAt: -1 });

export const PriceHistory =
  models.PriceHistory || model('PriceHistory', PriceHistorySchema);

/** Tracks when the current price for a product/variant was last saved. */
const PriceSaveMetaSchema = new Schema(
  {
    productId: { type: String, required: true },
    variantId: { type: String, default: '' },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number, default: null },
    savedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

PriceSaveMetaSchema.index({ productId: 1, variantId: 1 }, { unique: true });

export const PriceSaveMeta =
  models.PriceSaveMeta || model('PriceSaveMeta', PriceSaveMetaSchema);
