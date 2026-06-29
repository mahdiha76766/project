import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  CARD_TO_CARD_SETTINGS_KEY,
  defaultCardToCardSettings,
  normalizeCardToCardSettings,
  type CardToCardSettings
} from '@/lib/admin/card-to-card-config';

export type { CardToCardSettings } from '@/lib/admin/card-to-card-config';
export { defaultCardToCardSettings, normalizeCardToCardSettings } from '@/lib/admin/card-to-card-config';

export async function getCardToCardSettings(): Promise<CardToCardSettings> {
  try {
    await connectToDatabase();
    const row = await Setting.findOne({ key: CARD_TO_CARD_SETTINGS_KEY }).lean() as { value?: unknown } | null;
    return normalizeCardToCardSettings(row?.value);
  } catch {
    return defaultCardToCardSettings;
  }
}

export async function saveCardToCardSettings(value: CardToCardSettings) {
  await connectToDatabase();
  const normalized = normalizeCardToCardSettings(value);
  await Setting.findOneAndUpdate(
    { key: CARD_TO_CARD_SETTINGS_KEY },
    { value: normalized },
    { upsert: true, new: true }
  );
  return normalized;
}

export function getPublicBankInfo(settings: CardToCardSettings) {
  return {
    enabled: settings.enabled,
    cardNumber: settings.cardNumber,
    accountNumber: settings.accountNumber,
    accountHolder: settings.accountHolder,
    bankName: settings.bankName,
    instructions: settings.instructions
  };
}
