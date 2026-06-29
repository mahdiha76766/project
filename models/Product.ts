import { Schema, model, models } from 'mongoose';
import { PRODUCT_USAGE_TYPES, PRODUCT_WEIGHT_UNITS } from '@/constants/product';

const MediaItemSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    poster: { type: String, default: '' }
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: PRODUCT_WEIGHT_UNITS, default: 'g' },
    containerSize: { type: String, default: '' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    media: { type: [MediaItemSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    unit: { type: String, default: 'piece' },
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: PRODUCT_WEIGHT_UNITS, default: 'g' },
    containerSize: { type: String, default: '' },
    usageType: { type: String, enum: PRODUCT_USAGE_TYPES, default: 'EDIBLE' },
    volume: { type: Number, min: 0 },
    variants: { type: [ProductVariantSchema], default: [] },
    attributes: { type: Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    productionDate: { type: Date },
    expiryDate: { type: Date },
    seo: {
      title: String,
      description: String,
      keywords: [String]
    }
  },
  { timestamps: true }
);


ProductSchema.index({
  name: 'text',
  shortDescription: 'text',
  fullDescription: 'text',
  tags: 'text',
  'attributes.origin': 'text',
  'attributes.extraction': 'text'
});

export const Product = models.Product || model('Product', ProductSchema);
