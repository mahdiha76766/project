import { Schema, model, models } from 'mongoose';
import { ORDER_PAYMENT_METHODS, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_TIMINGS } from '@/constants/order';
import { SHIPPING_PAYMENT_TIMINGS } from '@/constants/shipping';

const AddressSchema = new Schema({
  fullName: String,
  phone: String,
  province: String,
  city: String,
  postalCode: String,
  addressLine: String,
  latitude: Number,
  longitude: Number
}, { _id: false });

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId },
  variantName: { type: String, default: '' },
  sku: { type: String, default: '' },
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
    shippingMethodCode: { type: String, default: '' },
    shippingMethodName: { type: String, default: '' },
    subtotalAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    shippingPaymentTiming: { type: String, enum: SHIPPING_PAYMENT_TIMINGS, default: 'ONLINE' },
    shippingDueOnDelivery: { type: Number, default: 0, min: 0 },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String, default: '' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'PENDING_PAYMENT' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },
    paymentTiming: { type: String, enum: PAYMENT_TIMINGS, default: 'ONLINE' },
    paymentMethod: { type: String, enum: ORDER_PAYMENT_METHODS, default: 'GATEWAY' },
    trackingCode: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Order = models.Order || model('Order', OrderSchema);
export const OrderItem = models.OrderItem || model('OrderItem', new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order' }, product: { type: Schema.Types.ObjectId, ref: 'Product' }, quantity: Number, price: Number }, { timestamps: true }));
