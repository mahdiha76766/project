import 'server-only';

import { AnalyticsPageView, AnalyticsSession } from '@/models/Analytics';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getAnalyticsSettings } from '@/lib/admin/analytics-settings';
import { detectDevice, isBotUserAgent, resolvePageMeta, shouldTrackPath } from '@/lib/analytics/page-meta';

type TrackPageViewInput = {
  sessionId: string;
  visitorId: string;
  userId?: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
};

type HeartbeatInput = {
  pageViewId: string;
  sessionId: string;
  durationSec: number;
  scrollDepth?: number;
};

type LeaveInput = {
  pageViewId: string;
  sessionId: string;
  durationSec: number;
  scrollDepth?: number;
};

export async function trackPageView(input: TrackPageViewInput) {
  const settings = await getAnalyticsSettings();
  if (!settings.enabled) return null;
  if (!shouldTrackPath(input.path, settings.excludePaths)) return null;
  if (input.path.startsWith('/admin') && !settings.trackAdmin) return null;

  const ua = input.userAgent || '';
  const bot = isBotUserAgent(ua);
  if (bot) return null;

  await connectToDatabase();
  const meta = resolvePageMeta(input.path, input.title);
  const device = detectDevice(ua);
  const now = new Date();

  await AnalyticsSession.findOneAndUpdate(
    { sessionId: input.sessionId },
    {
      $set: {
        visitorId: input.visitorId,
        userId: input.userId || undefined,
        referrer: input.referrer || '',
        userAgent: ua.slice(0, 500),
        device,
        isBot: false,
        lastActivityAt: now,
        endedAt: undefined
      },
      $setOnInsert: {
        sessionId: input.sessionId,
        landingPath: input.path
      },
      $inc: { pageViews: 1 }
    },
    { upsert: true, new: true }
  );

  const view = await AnalyticsPageView.create({
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    userId: input.userId || undefined,
    path: input.path,
    title: input.title || '',
    contentType: meta.contentType,
    contentSlug: meta.contentSlug,
    referrer: input.referrer || '',
    device,
    durationSec: 0,
    scrollDepth: 0,
    isActive: true
  });

  return { pageViewId: String(view._id) };
}

export async function trackHeartbeat(input: HeartbeatInput) {
  const settings = await getAnalyticsSettings();
  if (!settings.enabled) return;

  await connectToDatabase();
  const now = new Date();
  await AnalyticsPageView.findByIdAndUpdate(input.pageViewId, {
    durationSec: Math.max(0, input.durationSec),
    scrollDepth: input.scrollDepth ?? 0,
    isActive: true
  });
  await AnalyticsSession.findOneAndUpdate(
    { sessionId: input.sessionId },
    { lastActivityAt: now, $inc: { totalDurationSec: 0 } }
  );
}

export async function trackLeave(input: LeaveInput) {
  const settings = await getAnalyticsSettings();
  if (!settings.enabled) return;

  await connectToDatabase();
  const now = new Date();
  const view = await AnalyticsPageView.findByIdAndUpdate(
    input.pageViewId,
    {
      durationSec: Math.max(0, input.durationSec),
      scrollDepth: input.scrollDepth ?? 0,
      isActive: false,
      leftAt: now
    },
    { new: true }
  );
  if (!view) return;

  await AnalyticsSession.findOneAndUpdate(
    { sessionId: input.sessionId },
    {
      lastActivityAt: now,
      $inc: { totalDurationSec: Math.max(0, input.durationSec) }
    }
  );
}

export async function endSession(sessionId: string) {
  await connectToDatabase();
  await AnalyticsSession.findOneAndUpdate(
    { sessionId },
    { endedAt: new Date(), lastActivityAt: new Date() }
  );
  await AnalyticsPageView.updateMany({ sessionId, isActive: true }, { isActive: false, leftAt: new Date() });
}
