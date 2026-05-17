import { Schema, model, models } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, unique: true, sparse: true },
    unit: { type: String, default: 'piece' },
    weight: { type: Number, min: 0 },
    volume: { type: Number, min: 0 },
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
