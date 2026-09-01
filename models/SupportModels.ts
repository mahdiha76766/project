import { Schema, model, models } from 'mongoose';
import { PAYMENT_STATUSES } from '@/constants/order';
import { SHIPPING_METHOD_CODES } from '@/constants/shipping';

export const Coupon = models.Coupon || model('Coupon', new Schema({
  code: { type: String, unique: true, required: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
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
export const ShippingMethod = models.ShippingMethod || model('ShippingMethod', new Schema({
  code: { type: String, enum: SHIPPING_METHOD_CODES, unique: true },
  name: String,
  baseCost: Number,
  costPerKg: { type: Number, default: 0 },
  estimatedDays: Number,
  cityOnly: { type: Boolean, default: false },
  freeAboveAmount: Number,
  allowShippingOnDelivery: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true }));
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
const BlogMediaItemSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    url: { type: String, required: true },
    poster: { type: String, default: '' }
  },
  { _id: false }
);

export const BlogPost = models.BlogPost || model('BlogPost', new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, required: true, trim: true },
  excerpt: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  media: { type: [BlogMediaItemSchema], default: [] },
  content: { type: String, required: true, default: '' },
  category: { type: String, default: 'عمومی', index: true },
  tags: [{ type: String }],
  author: { type: String, default: 'تیم محتوای نابسرا' },
  views: { type: Number, default: 0 },
  seoMetaTitle: { type: String, default: '' },
  seoMetaDescription: { type: String, default: '' },
  relatedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date
}, { timestamps: true }));
export const Banner = models.Banner || model('Banner', new Schema({ title: String, image: String, link: String, position: String, isActive: { type: Boolean, default: true } }, { timestamps: true }));
export const Setting = models.Setting || model('Setting', new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true }));
export const Notification = models.Notification || model('Notification', new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User' }, title: String, message: String, isRead: { type: Boolean, default: false } }, { timestamps: true }));
export const InventoryLog = models.InventoryLog || model('InventoryLog', new Schema({ product: { type: Schema.Types.ObjectId, ref: 'Product' }, change: Number, reason: String, performedBy: { type: Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true }));
export const BlogComment = models.BlogComment || model('BlogComment', new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'BlogPost', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: '' },
  comment: { type: String, required: true },
  status: { type: String, enum: ['PENDING','APPROVED','REJECTED'], default: 'PENDING', index: true },
  isDeleted: { type: Boolean, default: false, index: true }
}, { timestamps: true }));

export const ReturnRequest = models.ReturnRequest || model('ReturnRequest', new Schema({ userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, reason: { type: String, required: true }, status: { type: String, enum: ['PENDING','APPROVED','REJECTED','COMPLETED'], default: 'PENDING' } }, { timestamps: true }));

export const PaymentReceipt = models.PaymentReceipt || model('PaymentReceipt', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['order', 'wallet_topup'], required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
  invoiceNumber: { type: String, index: true },
  amount: { type: Number, required: true, min: 0 },
  imagePath: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  adminNote: { type: String, default: '' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  purgeAt: { type: Date, index: true }
}, { timestamps: true }));

export const OtpCode = models.OtpCode || model('OtpCode', new Schema({
  mobile: { type: String, required: true, index: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'register'], required: true },
  payload: { type: Schema.Types.Mixed },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: true },
  verified: { type: Boolean, default: false }
}, { timestamps: true }));

export const SmsLog = models.SmsLog || model('SmsLog', new Schema({
  mobile: { type: String, required: true, index: true },
  message: { type: String, default: '' },
  eventKey: { type: String, default: '' },
  sendType: { type: String, enum: ['verify', 'bulk', 'manual'], default: 'bulk' },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending', index: true },
  providerStatus: { type: Number },
  providerMessage: { type: String, default: '' },
  messageId: { type: Number },
  packId: { type: String, default: '' },
  cost: { type: Number },
  meta: { type: Schema.Types.Mixed },
  sentBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));

export const ContactInquiry = models.ContactInquiry || model('ContactInquiry', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  status: { type: String, enum: ['NEW', 'READ'], default: 'NEW', index: true }
}, { timestamps: true }));

export const DOWNLOAD_KINDS = ['pdf', 'brochure', 'catalog', 'info'] as const;

export const DownloadAsset = models.DownloadAsset || model('DownloadAsset', new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: 'application/pdf' },
  kind: { type: String, enum: DOWNLOAD_KINDS, default: 'pdf', index: true },
  relatedProduct: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true }));

export const UserAddress = models.UserAddress || model('UserAddress', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, default: 'آدرس' },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  addressLine: { type: String, required: true },
  postalCode: { type: String, required: true },
  plaque: { type: String, default: '' },
  unit: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true }));
