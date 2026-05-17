import { Schema, model, models } from 'mongoose';

const AddressSchema = new Schema({
  fullName: String,
  phone: String,
  province: String,
  city: String,
  postalCode: String,
  addressLine: String
}, { _id: false });

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    shippingMethod: { type: Schema.Types.ObjectId, ref: 'ShippingMethod' },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    orderStatus: { type: String, default: 'PENDING' },
    paymentStatus: { type: String, default: 'UNPAID' },
    trackingCode: { type: String }
  },
  { timestamps: true }
);

export const Order = models.Order || model('Order', OrderSchema);
export const OrderItem = models.OrderItem || model('OrderItem', new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order' }, product: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number }, { timestamps: true }));
