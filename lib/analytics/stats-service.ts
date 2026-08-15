import 'server-only';

import { AnalyticsPageView, AnalyticsSession } from '@/models/Analytics';
import { BlogPost, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { tehranDateKey } from '@/lib/admin/dashboard-dates';

export type AnalyticsRangeDays = 7 | 14 | 30 | 90;

export const TOP_PAGES_LIMIT = 8;
export const TOP_PRODUCTS_LIMIT = 8;
export const TOP_BLOGS_LIMIT = 8;
export const DEVICE_DETAIL_LIMIT = 12;

function rangeStart(rangeDays: AnalyticsRangeDays) {
  const d = new Date();
  d.setDate(d.getDate() - (rangeDays - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function visitorIdExpr() {
  return { $ifNull: ['$visitorKey', '$visitorId'] };
}

function cleanTrackedTitle(title?: string, slug?: string) {
  const raw = String(title || '').trim();
  if (!raw || raw === slug) return '';
  // document.title often looks like "Name | ناب سرا"
  return raw.split(/\s*\|\s*/)[0]?.trim() || raw;
}

async function enrichContentTitles(
  rows: Array<{ _id: string; title?: string; views: number; avgDuration: number }>,
  kind: 'product' | 'blog'
) {
  const slugs = rows.map((r) => r._id).filter(Boolean);
  const nameBySlug = new Map<string, string>();

  if (slugs.length) {
    if (kind === 'product') {
      const products = await Product.find({ slug: { $in: slugs } }).select('slug name').lean();
      for (const p of products as Array<{ slug?: string; name?: string }>) {
        if (p.slug && p.name) nameBySlug.set(p.slug, p.name);
      }
    } else {
      const posts = await BlogPost.find({ slug: { $in: slugs } }).select('slug title').lean();
      for (const p of posts as Array<{ slug?: string; title?: string }>) {
        if (p.slug && p.title) nameBySlug.set(p.slug, p.title);
      }
    }
  }

  return rows.map((row) => {
    const slug = row._id;
    const title = nameBySlug.get(slug) || cleanTrackedTitle(row.title, slug) || slug;
    return {
      slug,
      title,
      views: row.views,
      avgDurationSec: Math.round(row.avgDuration || 0)
    };
  });
}

export async function getAnalyticsSummary(rangeDays: AnalyticsRangeDays = 7) {
  await connectToDatabase();
  const since = rangeStart(rangeDays);
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last12Weeks = new Date();
  last12Weeks.setDate(last12Weeks.getDate() - 12 * 7);
  const last6Months = new Date();
  last6Months.setMonth(last6Months.getMonth() - 6);

  const visitorField = visitorIdExpr();

  const [
    totalPageViews,
    uniqueVisitorsAgg,
    uniqueSessions,
    activeNow,
    avgDurationAgg,
    viewsTrend,
    weeklyTrend,
    monthlyTrend,
    hourlyActive,
    topPages,
    topProducts,
    topBlogs,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    deviceDetailBreakdown,
    contentTypeBreakdown
  ] = await Promise.all([
    AnalyticsPageView.countDocuments({ createdAt: { $gte: since } }),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: visitorField } },
      { $count: 'count' }
    ]),
    AnalyticsSession.countDocuments({ createdAt: { $gte: since }, isBot: false }),
    AnalyticsSession.countDocuments({
      lastActivityAt: { $gte: activeSince },
      isBot: false,
      endedAt: { $exists: false }
    }),
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
          visitors: { $addToSet: visitorField }
        }
      },
      { $project: { date: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { date: 1 } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: last12Weeks } } },
      {
        $group: {
          _id: { $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: 'Asia/Tehran' } },
          views: { $sum: 1 },
          visitors: { $addToSet: visitorField }
        }
      },
      { $project: { week: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { week: 1 } },
      { $limit: 12 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: last6Months } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Tehran' } },
          views: { $sum: 1 },
          visitors: { $addToSet: visitorField }
        }
      },
      { $project: { month: '$_id', views: 1, visitors: { $size: '$visitors' } } },
      { $sort: { month: 1 } },
      { $limit: 6 }
    ]),
    AnalyticsSession.aggregate([
      { $match: { lastActivityAt: { $gte: last24h }, isBot: false } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$lastActivityAt', timezone: 'Asia/Tehran' }
          },
          visitors: { $addToSet: { $ifNull: ['$visitorKey', '$visitorId'] } },
          sessions: { $sum: 1 }
        }
      },
      { $project: { hour: '$_id', activeUsers: { $size: '$visitors' }, sessions: 1 } },
      { $sort: { hour: 1 } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$path',
          title: { $last: '$title' },
          views: { $sum: 1 },
          avgDuration: { $avg: '$durationSec' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: TOP_PAGES_LIMIT }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, contentType: 'product', contentSlug: { $ne: '' } } },
      {
        $group: {
          _id: '$contentSlug',
          title: { $last: '$title' },
          views: { $sum: 1 },
          avgDuration: { $avg: '$durationSec' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: TOP_PRODUCTS_LIMIT }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, contentType: 'blog', contentSlug: { $ne: '' } } },
      {
        $group: {
          _id: '$contentSlug',
          title: { $last: '$title' },
          views: { $sum: 1 },
          avgDuration: { $avg: '$durationSec' }
        }
      },
      { $sort: { views: -1 } },
      { $limit: TOP_BLOGS_LIMIT }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, browser: { $ne: '' } } },
      {
        $group: {
          _id: { browser: '$browser', version: '$browserVersion' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since }, os: { $ne: '' } } },
      {
        $group: {
          _id: { os: '$os', version: '$osVersion' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            label: {
              $cond: [
                { $and: [{ $ne: ['$deviceLabel', ''] }, { $ne: ['$deviceLabel', null] }] },
                '$deviceLabel',
                {
                  $concat: [
                    { $ifNull: ['$browser', 'نامشخص'] },
                    ' · ',
                    { $ifNull: ['$os', 'نامشخص'] },
                    ' · ',
                    { $ifNull: ['$device', 'unknown'] }
                  ]
                }
              ]
            },
            deviceType: '$device',
            browser: '$browser',
            os: '$os',
            vendor: '$deviceVendor',
            model: '$deviceModel'
          },
          count: { $sum: 1 },
          screens: { $addToSet: { w: '$screenWidth', h: '$screenHeight' } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: DEVICE_DETAIL_LIMIT }
    ]),
    AnalyticsPageView.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const trendMap = new Map(
    viewsTrend.map((d: { date: string; views: number; visitors: number }) => [d.date, d])
  );
  const trend: Array<{ date: string; views: number; visitors: number }> = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = tehranDateKey(new Date(Date.now() - i * 86400000));
    const row = trendMap.get(key);
    trend.push({ date: key, views: row?.views || 0, visitors: row?.visitors || 0 });
  }

  // Fill last 24 hourly buckets
  const hourlyMap = new Map(
    hourlyActive.map((h: { hour: string; activeUsers: number; sessions: number }) => [h.hour, h])
  );
  const hourlyTrend: Array<{ hour: string; label: string; activeUsers: number; sessions: number }> = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(Date.now() - i * 60 * 60 * 1000);
    const key = d.toLocaleString('sv-SE', { timeZone: 'Asia/Tehran' }).slice(0, 13) + ':00';
    const row = hourlyMap.get(key);
    hourlyTrend.push({
      hour: key,
      label: d.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' }),
      activeUsers: row?.activeUsers || 0,
      sessions: row?.sessions || 0
    });
  }

  return {
    rangeDays,
    totalPageViews,
    uniqueVisitors: uniqueVisitorsAgg[0]?.count || 0,
    uniqueSessions,
    activeNow,
    avgDurationSec: Math.round(avgDurationAgg[0]?.avg || 0),
    trend,
    weeklyTrend: weeklyTrend.map((w: { week: string; views: number; visitors: number }) => ({
      week: w.week,
      label: `هفته ${w.week.split('-W')[1] || w.week}`,
      views: w.views,
      visitors: w.visitors
    })),
    monthlyTrend: monthlyTrend.map((m: { month: string; views: number; visitors: number }) => ({
      month: m.month,
      label: m.month,
      views: m.views,
      visitors: m.visitors
    })),
    hourlyTrend,
    topPages: topPages.map((p: { _id: string; title?: string; views: number; avgDuration: number }) => ({
      path: p._id,
      title: p.title || p._id,
      views: p.views,
      avgDurationSec: Math.round(p.avgDuration || 0)
    })),
    topProducts: await enrichContentTitles(
      topProducts as Array<{ _id: string; title?: string; views: number; avgDuration: number }>,
      'product'
    ),
    topBlogs: await enrichContentTitles(
      topBlogs as Array<{ _id: string; title?: string; views: number; avgDuration: number }>,
      'blog'
    ),
    deviceBreakdown: deviceBreakdown.map((d: { _id: string; count: number }) => ({
      device: d._id || 'unknown',
      count: d.count
    })),
    browserBreakdown: browserBreakdown.map(
      (b: { _id: { browser: string; version: string }; count: number }) => ({
        name: b._id.version ? `${b._id.browser} ${b._id.version.split('.')[0]}` : b._id.browser,
        count: b.count
      })
    ),
    osBreakdown: osBreakdown.map((o: { _id: { os: string; version: string }; count: number }) => ({
      name: o._id.version ? `${o._id.os} ${o._id.version}` : o._id.os,
      count: o.count
    })),
    deviceDetailBreakdown: deviceDetailBreakdown.map(
      (d: {
        _id: {
          label: string;
          deviceType: string;
          browser: string;
          os: string;
          vendor: string;
          model: string;
        };
        count: number;
        screens: Array<{ w?: number; h?: number }>;
      }) => {
        const screen = d.screens?.find((s) => s.w && s.h);
        return {
          label: d._id.label,
          deviceType: d._id.deviceType || 'unknown',
          browser: d._id.browser || '',
          os: d._id.os || '',
          vendor: d._id.vendor || '',
          model: d._id.model || '',
          screen: screen ? `${screen.w}×${screen.h}` : '',
          count: d.count
        };
      }
    ),
    contentTypeBreakdown: contentTypeBreakdown.map((d: { _id: string; count: number }) => ({
      type: d._id || 'other',
      count: d.count
    }))
  };
}

export async function getRealtimeAnalytics() {
  await connectToDatabase();
  const activeSince = new Date(Date.now() - 5 * 60 * 1000);
  const [activeSessions, activePages] = await Promise.all([
    AnalyticsSession.find({ lastActivityAt: { $gte: activeSince }, isBot: false })
      .sort({ lastActivityAt: -1 })
      .limit(20)
      .select(
        'sessionId device deviceLabel browser os deviceModel pageViews totalDurationSec lastActivityAt'
      )
      .lean(),
    AnalyticsPageView.find({ isActive: true, updatedAt: { $gte: activeSince } })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('path title contentType contentSlug device deviceLabel browser os durationSec updatedAt')
      .lean()
  ]);
  return {
    activeSessions,
    activePages: activePages.map((p) => ({
      path: p.path,
      title: p.title,
      contentType: p.contentType,
      device: p.deviceLabel || p.device,
      durationSec: p.durationSec
    })),
    activeCount: activeSessions.length
  };
}
