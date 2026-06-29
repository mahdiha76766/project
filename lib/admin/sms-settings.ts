import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  SMS_SETTINGS_KEY,
  defaultSmsSettings,
  normalizeSmsSettings,
  type SmsSettings
} from '@/lib/admin/sms-settings-config';

export type { SmsSettings, SmsEventKey } from '@/lib/admin/sms-settings-config';
export {
  SMS_SETTINGS_KEY,
  defaultSmsSettings,
  normalizeSmsSettings,
  SMS_EVENT_LABELS,
  renderSmsTemplate
} from '@/lib/admin/sms-settings-config';

export async function getSmsSettings(): Promise<SmsSettings> {
  try {
    await connectToDatabase();
    const row = await Setting.findOne({ key: SMS_SETTINGS_KEY }).lean() as { value?: unknown } | null;
    const settings = normalizeSmsSettings(row?.value);
    if (!settings.apiKey && process.env.SMS_IR_API_KEY) {
      settings.apiKey = process.env.SMS_IR_API_KEY;
    }
    if (!settings.sandboxApiKey && process.env.SMS_IR_SANDBOX_API_KEY) {
      settings.sandboxApiKey = process.env.SMS_IR_SANDBOX_API_KEY;
    }
    return settings;
  } catch {
    const settings = defaultSmsSettings;
    if (process.env.SMS_IR_API_KEY) settings.apiKey = process.env.SMS_IR_API_KEY;
    if (process.env.SMS_IR_SANDBOX_API_KEY) settings.sandboxApiKey = process.env.SMS_IR_SANDBOX_API_KEY;
    return settings;
  }
}

export async function saveSmsSettings(value: SmsSettings) {
  await connectToDatabase();
  const normalized = normalizeSmsSettings(value);
  await Setting.findOneAndUpdate(
    { key: SMS_SETTINGS_KEY },
    { value: normalized },
    { upsert: true, new: true }
  );
  return normalized;
}

export function getActiveApiKey(settings: SmsSettings) {
  if (settings.useSandbox && settings.sandboxApiKey) return settings.sandboxApiKey;
  return settings.apiKey;
}
