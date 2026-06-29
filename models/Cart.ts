import { Schema, model, models } from 'mongoose';

const CartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId },
  quantity: { type: Number, min: 1, default: 1 },
  weight: String,
  volume: String
}, { _id: false });

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [CartItemSchema]
  },
  { timestamps: true }
);

export const Cart = models.Cart || model('Cart', CartSchema);
