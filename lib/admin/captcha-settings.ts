import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  CAPTCHA_SETTINGS_KEY,
  defaultCaptchaSettings,
  normalizeCaptchaSettings,
  type CaptchaSettings
} from '@/lib/admin/captcha-settings-config';

export type { CaptchaSettings, CaptchaScope } from '@/lib/admin/captcha-settings-config';
export {
  CAPTCHA_SETTINGS_KEY,
  defaultCaptchaSettings,
  normalizeCaptchaSettings,
  isCaptchaRequired
} from '@/lib/admin/captcha-settings-config';

export async function getCaptchaSettings(): Promise<CaptchaSettings> {
  try {
    await connectToDatabase();
    const row = (await Setting.findOne({ key: CAPTCHA_SETTINGS_KEY }).lean()) as { value?: unknown } | null;
    return normalizeCaptchaSettings(row?.value);
  } catch {
    return defaultCaptchaSettings;
  }
}

export async function saveCaptchaSettings(value: CaptchaSettings) {
  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: CAPTCHA_SETTINGS_KEY },
    { value: normalizeCaptchaSettings(value) },
    { upsert: true, new: true }
  );
}
