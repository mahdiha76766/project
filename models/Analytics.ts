import { Schema, model, models } from 'mongoose';

export type AnalyticsContentType = 'page' | 'product' | 'blog' | 'category' | 'checkout' | 'dashboard' | 'other';

const AnalyticsSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    visitorId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    landingPath: { type: String, default: '/' },
    referrer: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
    pageViews: { type: Number, default: 0 },
    totalDurationSec: { type: Number, default: 0 },
    isBot: { type: Boolean, default: false, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date }
  },
  { timestamps: true }
);

const AnalyticsPageViewSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    path: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    contentType: {
      type: String,
      enum: ['page', 'product', 'blog', 'category', 'checkout', 'dashboard', 'other'],
      default: 'page',
      index: true
    },
    contentSlug: { type: String, default: '', index: true },
    referrer: { type: String, default: '' },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop', 'unknown'], default: 'unknown' },
    durationSec: { type: Number, default: 0 },
    scrollDepth: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    leftAt: { type: Date }
  },
  { timestamps: true }
);

AnalyticsSessionSchema.index({ createdAt: -1 });
AnalyticsPageViewSchema.index({ createdAt: -1 });
AnalyticsPageViewSchema.index({ path: 1, createdAt: -1 });

export const AnalyticsSession = models.AnalyticsSession || model('AnalyticsSession', AnalyticsSessionSchema);
export const AnalyticsPageView = models.AnalyticsPageView || model('AnalyticsPageView', AnalyticsPageViewSchema);
