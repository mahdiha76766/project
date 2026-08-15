import 'server-only';

import bcrypt from 'bcryptjs';
import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  PRICE_PORTAL_SETTINGS_KEY,
  defaultPricePortalSettings,
  normalizePricePortalSettings,
  type PricePortalSettings
} from '@/lib/admin/price-portal-settings-config';

export type { PricePortalSettings } from '@/lib/admin/price-portal-settings-config';
export {
  PRICE_PORTAL_SETTINGS_KEY,
  defaultPricePortalSettings,
  normalizePathSlug,
  isReservedPortalSlug
} from '@/lib/admin/price-portal-settings-config';

export async function getPricePortalSettings(): Promise<PricePortalSettings> {
  try {
    await connectToDatabase();
    const row = (await Setting.findOne({ key: PRICE_PORTAL_SETTINGS_KEY }).lean()) as {
      value?: unknown;
    } | null;
    return normalizePricePortalSettings(row?.value);
  } catch {
    return defaultPricePortalSettings;
  }
}

export async function savePricePortalSettings(
  input: { enabled: boolean; pathSlug: string; password?: string },
  current?: PricePortalSettings
) {
  await connectToDatabase();
  const base = current || (await getPricePortalSettings());
  const normalized = normalizePricePortalSettings({
    enabled: input.enabled,
    pathSlug: input.pathSlug,
    passwordHash: base.passwordHash
  });

  if (input.password && input.password.length > 0) {
    normalized.passwordHash = await bcrypt.hash(input.password, 10);
  }

  if (!normalized.passwordHash) {
    throw new Error('رمز عبور الزامی است.');
  }

  await Setting.findOneAndUpdate(
    { key: PRICE_PORTAL_SETTINGS_KEY },
    { value: normalized },
    { upsert: true, new: true }
  );

  return normalized;
}
