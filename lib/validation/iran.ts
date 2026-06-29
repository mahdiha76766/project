import { z } from 'zod';
import { normalizeMobile } from '@/lib/validation/mobile';

const toAsciiDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d]/g, '');

export const iranMobileSchema = z
  .string()
  .transform((v) => normalizeMobile(v))
  .pipe(z.string().regex(/^09\d{9}$/, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود'));

export const iranPostalCodeSchema = z
  .string()
  .transform((v) => toAsciiDigits(v))
  .pipe(z.string().regex(/^\d{10}$/, 'کد پستی باید دقیقاً ۱۰ رقم باشد'));

export const iranLandlineSchema = z
  .string()
  .transform((v) => toAsciiDigits(v))
  .pipe(z.string().regex(/^0\d{10}$/, 'شماره تلفن ثابت باید ۱۱ رقم و با ۰ شروع شود'))
  .optional()
  .or(z.literal(''));
