import { z } from 'zod';
import { iranMobileSchema, iranPostalCodeSchema } from '@/lib/validation/iran';

const fieldMessages: Record<string, string> = {
  title: 'عنوان آدرس باید حداقل ۲ کاراکتر باشد',
  recipientName: 'نام گیرنده باید حداقل ۲ کاراکتر باشد',
  province: 'استان را وارد کنید',
  city: 'شهر را وارد کنید',
  addressLine: 'آدرس باید حداقل ۱۰ کاراکتر باشد'
};

export const addressSchema = z.object({
  title: z.string().trim().min(2, fieldMessages.title).max(60),
  recipientName: z.string().trim().min(2, fieldMessages.recipientName).max(80),
  phone: iranMobileSchema,
  province: z.string().trim().min(2, fieldMessages.province).max(40),
  city: z.string().trim().min(2, fieldMessages.city).max(40),
  addressLine: z.string().trim().min(10, fieldMessages.addressLine).max(300),
  postalCode: iranPostalCodeSchema,
  plaque: z.string().trim().max(20).optional(),
  unit: z.string().trim().max(20).optional(),
  latitude: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().min(-90).max(90).nullable().optional()
  ),
  longitude: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().min(-180).max(180).nullable().optional()
  ),
  isDefault: z.boolean().optional()
});

export const addressUpdateSchema = addressSchema.partial();

export function parseAddressBody(body: unknown) {
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: first?.message || 'اطلاعات آدرس نامعتبر است' };
  }
  return { ok: true as const, data: parsed.data };
}

export function parseAddressUpdateBody(body: unknown) {
  const parsed = addressUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false as const, error: first?.message || 'اطلاعات آدرس نامعتبر است' };
  }
  return { ok: true as const, data: parsed.data };
}

export function addressDisplayTitle(addr: { title?: string; recipientName?: string; city?: string }) {
  if (addr.title?.trim()) return addr.title.trim();
  if (addr.recipientName && addr.city) return `${addr.recipientName} — ${addr.city}`;
  return addr.recipientName || 'آدرس';
}

export function truncateAddress(text?: string, max = 48) {
  if (!text) return '';
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export function formatAddressOption(addr: {
  title?: string;
  recipientName?: string;
  addressLine?: string;
  city?: string;
}) {
  const title = addressDisplayTitle(addr);
  const recipient = addr.recipientName || '';
  const snippet = truncateAddress(addr.addressLine, 36);
  const city = addr.city ? `، ${addr.city}` : '';
  return `${title} — ${recipient} — ${snippet}${city}`;
}
