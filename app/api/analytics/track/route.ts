import { NextResponse } from 'next/server';
import { z } from 'zod';
import { endSession, trackHeartbeat, trackLeave, trackPageView } from '@/lib/analytics/tracker-service';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rate-limit';

const pageViewSchema = z.object({
  type: z.literal('pageview'),
  sessionId: z.string().min(8).max(80),
  visitorId: z.string().min(8).max(80),
  path: z.string().min(1).max(500),
  title: z.string().max(300).optional(),
  referrer: z.string().max(500).optional()
});

const heartbeatSchema = z.object({
  type: z.literal('heartbeat'),
  sessionId: z.string().min(8).max(80),
  pageViewId: z.string().min(8).max(80),
  durationSec: z.number().min(0).max(86400),
  scrollDepth: z.number().min(0).max(100).optional()
});

const leaveSchema = z.object({
  type: z.literal('leave'),
  sessionId: z.string().min(8).max(80),
  pageViewId: z.string().min(8).max(80),
  durationSec: z.number().min(0).max(86400),
  scrollDepth: z.number().min(0).max(100).optional()
});

const endSchema = z.object({
  type: z.literal('end'),
  sessionId: z.string().min(8).max(80)
});

const bodySchema = z.discriminatedUnion('type', [pageViewSchema, heartbeatSchema, leaveSchema, endSchema]);

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rate = checkRateLimit(`analytics:${ip}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const ua = req.headers.get('user-agent') || '';
    const session = await getSessionUser();

    if (body.type === 'pageview') {
      const result = await trackPageView({
        sessionId: body.sessionId,
        visitorId: body.visitorId,
        userId: session?.userId,
        path: body.path,
        title: body.title,
        referrer: body.referrer,
        userAgent: ua
      });
      return NextResponse.json({ ok: true, pageViewId: result?.pageViewId || null });
    }

    if (body.type === 'heartbeat') {
      await trackHeartbeat({
        sessionId: body.sessionId,
        pageViewId: body.pageViewId,
        durationSec: body.durationSec,
        scrollDepth: body.scrollDepth
      });
      return NextResponse.json({ ok: true });
    }

    if (body.type === 'leave') {
      await trackLeave({
        sessionId: body.sessionId,
        pageViewId: body.pageViewId,
        durationSec: body.durationSec,
        scrollDepth: body.scrollDepth
      });
      return NextResponse.json({ ok: true });
    }

    await endSession(body.sessionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
