import { Schema, model, models } from 'mongoose';

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: { type: Number, min: 1, default: 1 } }]
  },
  { timestamps: true }
);

export const Cart = models.Cart || model('Cart', CartSchema);
