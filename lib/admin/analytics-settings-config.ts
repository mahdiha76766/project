export const ANALYTICS_SETTINGS_KEY = 'analytics_settings';

export type AnalyticsSettings = {
  enabled: boolean;
  trackAdmin: boolean;
  trackAuthenticated: boolean;
  heartbeatSeconds: number;
  retentionDays: number;
  excludePaths: string[];
};

export const defaultAnalyticsSettings: AnalyticsSettings = {
  enabled: true,
  trackAdmin: false,
  trackAuthenticated: true,
  heartbeatSeconds: 30,
  retentionDays: 90,
  excludePaths: ['/api', '/_next', '/favicon.ico']
};

export function normalizeAnalyticsSettings(raw: unknown): AnalyticsSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<AnalyticsSettings>;
  return {
    enabled: v.enabled !== false,
    trackAdmin: v.trackAdmin === true,
    trackAuthenticated: v.trackAuthenticated !== false,
    heartbeatSeconds: Math.min(120, Math.max(15, Number(v.heartbeatSeconds) || 30)),
    retentionDays: Math.min(365, Math.max(7, Number(v.retentionDays) || 90)),
    excludePaths: Array.isArray(v.excludePaths)
      ? v.excludePaths.filter((p): p is string => typeof p === 'string')
      : defaultAnalyticsSettings.excludePaths
  };
}
