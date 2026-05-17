import { Schema, model, models } from 'mongoose';
import { PAYMENT_STATUSES } from '@/constants/order';
import { SHIPPING_METHOD_CODES } from '@/constants/shipping';

export const Coupon = models.Coupon || model('Coupon', new Schema({
  code: { type: String, unique: true, required: true },
  discountType: { type: String, enum: ['PERCENT', 'FIXED', 'FREE_SHIPPING'], required: true },
  value: { type: Number, default: 0 },
  minPurchaseAmount: { type: Number, default: 0 },
  maxDiscountAmount: { type: Number },
  startsAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  usageLimit: { type: Number, default: 0 },
  usagePerUserLimit: { type: Number, default: 1 },
  allowedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  allowedCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true }));

export const CouponUsage = models.CouponUsage || model('CouponUsage', new Schema({ coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' }, user: { type: Schema.Types.ObjectId, ref: 'User' }, order: { type: Schema.Types.ObjectId, ref: 'Order' }, usedAt: { type: Date, default: Date.now } }, { timestamps: true }));
export const ShippingMethod = models.ShippingMethod || model('ShippingMethod', new Schema({ code: { type: String, enum: SHIPPING_METHOD_CODES, unique: true }, name: String, baseCost: Number, estimatedDays: Number, cityOnly: { type: Boolean, default: false }, freeAboveAmount: Number, isActive: { type: Boolean, default: true } }, { timestamps: true }));
export const Payment = models.Payment || model('Payment', new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order' }, amount: Number, provider: { type: String, enum: ['ZARINPAL', 'ZIBAL', 'NEXTPAY', 'IDPAY'] }, status: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' }, transactionId: String, authority: String, paidAt: Date }, { timestamps: true }));
export const Shipment = models.Shipment || model('Shipment', new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order' }, method: { type: Schema.Types.ObjectId, ref: 'ShippingMethod' }, trackingCode: String, status: String, shippedAt: Date, deliveredAt: Date }, { timestamps: true }));
export const Review = models.Review || model('Review', new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, required: true },
  title: { type: String, default: '' },
  comment: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  adminReply: { type: String, default: '' },
  editedByAdmin: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true }));
export const Wishlist = models.Wishlist || model('Wishlist', new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', unique: true }, products: [{ type: Schema.Types.ObjectId, ref: 'Product' }] }, { timestamps: true }));
export const BlogPost = models.BlogPost || model('BlogPost', new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, required: true, trim: true },
  excerpt: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  content: { type: String, required: true, default: '' },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date
}, { timestamps: true }));
export const Banner = models.Banner || model('Banner', new Schema({ title: String, image: String, link: String, position: String, isActive: { type: Boolean, default: true } }, { timestamps: true }));
export const Setting = models.Setting || model('Setting', new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true }));
export const Notification = models.Notification || model('Notification', new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User' }, title: String, message: String, isRead: { type: Boolean, default: false } }, { timestamps: true }));
export const InventoryLog = models.InventoryLog || model('InventoryLog', new Schema({ product: { type: Schema.Types.ObjectId, ref: 'Product' }, change: Number, reason: String, performedBy: { type: Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true }));
