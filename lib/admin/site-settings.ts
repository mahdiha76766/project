import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  SITE_SETTINGS_KEY,
  defaultSiteSeoSettings,
  normalizeSiteSeoSettings,
  type SiteSeoSettings
} from '@/lib/admin/site-settings-config';

export type { SiteSeoSettings } from '@/lib/admin/site-settings-config';
export {
  SITE_SETTINGS_KEY,
  defaultSiteSeoSettings,
  normalizeSiteSeoSettings
} from '@/lib/admin/site-settings-config';

export async function getSiteSeoSettings(): Promise<SiteSeoSettings> {
  try {
    await connectToDatabase();
    const row = await Setting.findOne({ key: SITE_SETTINGS_KEY }).lean() as { value?: unknown } | null;
    return normalizeSiteSeoSettings(row?.value);
  } catch {
    return defaultSiteSeoSettings;
  }
}

export async function saveSiteSeoSettings(value: SiteSeoSettings) {
  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: SITE_SETTINGS_KEY },
    { value: normalizeSiteSeoSettings(value) },
    { upsert: true, new: true }
  );
}
