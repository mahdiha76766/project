import { Schema, model, models } from 'mongoose';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/constants/order';

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
  price: { type: Number, required: true, min: 0 },
  weight: String,
  volume: String
}, { _id: false });

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    shippingMethod: { type: Schema.Types.ObjectId, ref: 'ShippingMethod' },
    subtotalAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'PENDING_PAYMENT' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },
    paymentMethod: { type: String, enum: ['ZARINPAL', 'ZIBAL', 'NEXTPAY', 'IDPAY'] },
    trackingCode: { type: String }
  },
  { timestamps: true }
);

export const Order = models.Order || model('Order', OrderSchema);
export const OrderItem = models.OrderItem || model('OrderItem', new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order' }, product: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number }, { timestamps: true }));
