import 'server-only';

import { AnalyticsPageView, AnalyticsSession } from '@/models/Analytics';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getAnalyticsSettings } from '@/lib/admin/analytics-settings';
import { isBotUserAgent, resolvePageMeta, shouldTrackPath } from '@/lib/analytics/page-meta';
import { parseUserAgent } from '@/lib/analytics/user-agent-parser';
import { buildVisitorKey, hashIp, PAGEVIEW_DEDUP_MS, SESSION_IDLE_MS } from '@/lib/analytics/visitor-key';

type TrackPageViewInput = {
  sessionId: string;
  visitorId: string;
  userId?: string;
  path: string;
  title?: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  screenWidth?: number;
  screenHeight?: number;
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

function deviceFields(ua: string, screenWidth?: number, screenHeight?: number) {
  const parsed = parseUserAgent(ua);
  return {
    device: parsed.deviceType,
    browser: parsed.browser,
    browserVersion: parsed.browserVersion,
    os: parsed.os,
    osVersion: parsed.osVersion,
    deviceVendor: parsed.deviceVendor,
    deviceModel: parsed.deviceModel,
    deviceLabel: parsed.label,
    screenWidth,
    screenHeight
  };
}

async function findOrReuseSession(
  sessionId: string,
  visitorKey: string,
  idleSince: Date
) {
  const active = (await AnalyticsSession.findOne({
    visitorKey,
    isBot: false,
    lastActivityAt: { $gte: idleSince },
    endedAt: { $exists: false }
  })
    .sort({ lastActivityAt: -1 })
    .select('sessionId')
    .lean()) as { sessionId?: string } | null;

  if (active?.sessionId) return active.sessionId;
  return sessionId;
}

export async function trackPageView(input: TrackPageViewInput) {
  const settings = await getAnalyticsSettings();
  if (!settings.enabled) return null;
  if (!shouldTrackPath(input.path, settings.excludePaths)) return null;
  if (input.path.startsWith('/admin') && !settings.trackAdmin) return null;
  if (!settings.trackAuthenticated && input.userId) return null;

  const ua = input.userAgent || '';
  if (isBotUserAgent(ua)) return null;

  await connectToDatabase();

  const ip = input.ip || 'unknown';
  const visitorKey = buildVisitorKey(ip, ua);
  const ipHash = hashIp(ip);
  const meta = resolvePageMeta(input.path, input.title);
  const dev = deviceFields(ua, input.screenWidth, input.screenHeight);
  const now = new Date();
  const idleSince = new Date(Date.now() - SESSION_IDLE_MS);
  const dedupSince = new Date(Date.now() - PAGEVIEW_DEDUP_MS);

  // Dedup: same visitor + path within short window (refresh / close-reopen spam)
  const recent = (await AnalyticsPageView.findOne({
    $or: [{ visitorKey }, { visitorId: input.visitorId }],
    path: input.path,
    createdAt: { $gte: dedupSince }
  })
    .sort({ createdAt: -1 })
    .lean()) as { _id?: unknown; sessionId?: string; title?: string } | null;

  if (recent?._id && recent.sessionId) {
    const sid = recent.sessionId;
    await AnalyticsSession.findOneAndUpdate(
      { sessionId: sid },
      {
        $set: {
          lastActivityAt: now,
          endedAt: undefined,
          ...dev,
          userAgent: ua.slice(0, 500),
          ipHash,
          visitorKey
        }
      }
    );
    await AnalyticsPageView.findByIdAndUpdate(recent._id, {
      isActive: true,
      leftAt: undefined,
      title: input.title || recent.title
    });
    return { pageViewId: String(recent._id), sessionId: sid, deduplicated: true };
  }

  const effectiveSessionId = await findOrReuseSession(input.sessionId, visitorKey, idleSince);

  await AnalyticsSession.findOneAndUpdate(
    { sessionId: effectiveSessionId },
    {
      $set: {
        visitorId: input.visitorId,
        visitorKey,
        ipHash,
        userId: input.userId || undefined,
        referrer: input.referrer || '',
        userAgent: ua.slice(0, 500),
        ...dev,
        isBot: false,
        lastActivityAt: now,
        endedAt: undefined
      },
      $setOnInsert: {
        sessionId: effectiveSessionId,
        landingPath: input.path
      },
      $inc: { pageViews: 1 }
    },
    { upsert: true, new: true }
  );

  const view = await AnalyticsPageView.create({
    sessionId: effectiveSessionId,
    visitorId: input.visitorId,
    visitorKey,
    ipHash,
    userId: input.userId || undefined,
    path: input.path,
    title: input.title || '',
    contentType: meta.contentType,
    contentSlug: meta.contentSlug,
    referrer: input.referrer || '',
    ...dev,
    durationSec: 0,
    scrollDepth: 0,
    isActive: true
  });

  return { pageViewId: String(view._id), sessionId: effectiveSessionId, deduplicated: false };
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
    { lastActivityAt: now }
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
