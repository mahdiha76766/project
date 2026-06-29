import 'server-only';

import { AnalyticsPageView, AnalyticsSession } from '@/models/Analytics';
import { connectToDatabase } from '@/lib/db/mongoose';
import { tehranDateKey } from '@/lib/admin/dashboard-dates';

export type AnalyticsRangeDays = 7 | 14 | 30 | 90;

function rangeStart(rangeDays: AnalyticsRangeDays) {
  const d = new Date();
  d.setDate(d.getDate() - (rangeDays - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAnalyticsSummary(rangeDays: AnalyticsRangeDays = 7) {
  await connectToDatabase();
  const since = rangeStart(rangeDays);
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);

  const [
    totalPageViews,
    uniqueVisitors,
    uniqueSessions,
    activeNow,
    avgDurationAgg,
    viewsTrend,
    topPages,
    topProducts,
    topBlogs,
    deviceBreakdown,
    contentTypeBreakdown,
    recentSessions
  ] = await Promise.all([
    AnalyticsPageView.countDocuments({ createdAt: { $gte: since } }),
    AnalyticsPageView.distinct('visitorId', { createdAt: { $gte: since } }),
    AnalyticsSession.countDocuments({ createdAt: { $gte: since }, isBot: false }),
    AnalyticsSession.countDocuments({ lastActivityAt: { $gte: activeSince }, isBot: false, endedAt: { $exists: false } }),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, durationSec: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$durationSec' } } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Tehran' } },
          views: { $sum: 1 },
          visitors: { $addToSet: '$visitorId' }
        }
      },
      { $project: { date: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { date: 1 } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$path', title: { $last: '$title' }, views: { $sum: 1 }, avgDuration: { $avg: '$durationSec' } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, contentType: 'product' } },
      { $group: { _id: '$contentSlug', views: { $sum: 1 }, avgDuration: { $avg: '$durationSec' } } },
      { $sort: { views: -1 } },
      { $limit: 8 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, contentType: 'blog' } },
      { $group: { _id: '$contentSlug', views: { $sum: 1 }, avgDuration: { $avg: '$durationSec' } } },
      { $sort: { views: -1 } },
      { $limit: 8 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AnalyticsSession.find({ isBot: false })
      .sort({ lastActivityAt: -1 })
      .limit(12)
      .select('sessionId visitorId landingPath device pageViews totalDurationSec lastActivityAt createdAt')
      .lean()
  ]);

  const trendMap = new Map(viewsTrend.map((d: { date: string; views: number; visitors: number }) => [d.date, d]));
  const trend: Array<{ date: string; views: number; visitors: number }> = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = tehranDateKey(new Date(Date.now() - i * 86400000));
    const row = trendMap.get(key);
    trend.push({ date: key, views: row?.views || 0, visitors: row?.visitors || 0 });
  }

  return {
    rangeDays,
    totalPageViews,
    uniqueVisitors: uniqueVisitors.length,
    uniqueSessions,
    activeNow,
    avgDurationSec: Math.round(avgDurationAgg[0]?.avg || 0),
    trend,
    topPages: topPages.map((p: { _id: string; title?: string; views: number; avgDuration: number }) => ({
      path: p._id,
      title: p.title || p._id,
      views: p.views,
      avgDurationSec: Math.round(p.avgDuration || 0)
    })),
    topProducts: topProducts.map((p: { _id: string; views: number; avgDuration: number }) => ({
      slug: p._id,
      views: p.views,
      avgDurationSec: Math.round(p.avgDuration || 0)
    })),
    topBlogs: topBlogs.map((p: { _id: string; views: number; avgDuration: number }) => ({
      slug: p._id,
      views: p.views,
      avgDurationSec: Math.round(p.avgDuration || 0)
    })),
    deviceBreakdown: deviceBreakdown.map((d: { _id: string; count: number }) => ({
      device: d._id || 'unknown',
      count: d.count
    })),
    contentTypeBreakdown: contentTypeBreakdown.map((d: { _id: string; count: number }) => ({
      type: d._id || 'other',
      count: d.count
    })),
    recentSessions
  };
}

export async function getRealtimeAnalytics() {
  await connectToDatabase();
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);
  const [activeSessions, activePages] = await Promise.all([
    AnalyticsSession.find({ lastActivityAt: { $gte: activeSince }, isBot: false })
      .sort({ lastActivityAt: -1 })
      .limit(20)
      .select('sessionId device landingPath pageViews totalDurationSec lastActivityAt')
      .lean(),
    AnalyticsPageView.find({ isActive: true, updatedAt: { $gte: activeSince } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('path title contentType contentSlug device durationSec updatedAt')
      .lean()
  ]);
  return { activeSessions, activePages, activeCount: activeSessions.length };
}
