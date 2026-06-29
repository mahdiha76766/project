export const CARD_TO_CARD_SETTINGS_KEY = 'card_to_card_config';

export type CardToCardSettings = {
  enabled: boolean;
  cardNumber: string;
  accountNumber: string;
  accountHolder: string;
  bankName: string;
  instructions: string;
  receiptRetentionDays: number;
};

export const defaultCardToCardSettings: CardToCardSettings = {
  enabled: true,
  cardNumber: '',
  accountNumber: '',
  accountHolder: '',
  bankName: '',
  instructions:
    'مبلغ را دقیقاً مطابق فاکتور به شماره کارت زیر واریز کنید. سپس تصویر رسید را بارگذاری نمایید. پس از تأیید توسط پشتیبانی، سفارش شما پردازش می‌شود.',
  receiptRetentionDays: 14
};

function asBool(v: unknown, fallback: boolean) {
  return typeof v === 'boolean' ? v : fallback;
}

function asStr(v: unknown, fallback: string) {
  return typeof v === 'string' ? v : fallback;
}

function asNum(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeCardToCardSettings(raw: unknown): CardToCardSettings {
  const base = defaultCardToCardSettings;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<CardToCardSettings>;
  return {
    enabled: asBool(r.enabled, base.enabled),
    cardNumber: asStr(r.cardNumber, base.cardNumber),
    accountNumber: asStr(r.accountNumber, base.accountNumber),
    accountHolder: asStr(r.accountHolder, base.accountHolder),
    bankName: asStr(r.bankName, base.bankName),
    instructions: asStr(r.instructions, base.instructions),
    receiptRetentionDays: Math.min(90, Math.max(1, asNum(r.receiptRetentionDays, base.receiptRetentionDays)))
  };
}
