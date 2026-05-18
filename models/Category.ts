import { Schema, model, models } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Category = models.Category || model('Category', CategorySchema);
