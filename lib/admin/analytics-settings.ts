import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  ANALYTICS_SETTINGS_KEY,
  defaultAnalyticsSettings,
  normalizeAnalyticsSettings,
  type AnalyticsSettings
} from '@/lib/admin/analytics-settings-config';

export type { AnalyticsSettings } from '@/lib/admin/analytics-settings-config';
export {
  ANALYTICS_SETTINGS_KEY,
  defaultAnalyticsSettings,
  normalizeAnalyticsSettings
} from '@/lib/admin/analytics-settings-config';

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  try {
    await connectToDatabase();
    const row = (await Setting.findOne({ key: ANALYTICS_SETTINGS_KEY }).lean()) as { value?: unknown } | null;
    return normalizeAnalyticsSettings(row?.value);
  } catch {
    return defaultAnalyticsSettings;
  }
}

export async function saveAnalyticsSettings(value: AnalyticsSettings) {
  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: ANALYTICS_SETTINGS_KEY },
    { value: normalizeAnalyticsSettings(value) },
    { upsert: true, new: true }
  );
}
