import { z } from 'zod';
import { DEFAULT_MONGODB_URI } from '@/lib/db/mongo-config';

const envSchema = z.object({
  PORT: z.coerce.number().min(1).max(65535).optional(),
  MONGODB_URI: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  SAMAN_TERMINAL_ID: z.string().optional(),
  SAMAN_MERCHANT_ID: z.string().optional(),
  SAMAN_CALLBACK_URL: z.string().optional(),
  PAYMENT_TAX_RATE: z.coerce.number().min(0).max(1).default(0),
  WALLET_MIN_WITHDRAWAL: z.coerce.number().min(0).default(10000),
  ORDER_PAYMENT_TIMEOUT_MINUTES: z.coerce.number().min(5).default(15),
  APP_BASE_URL: z.string().optional()
});

const rawEnv = {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV,
  SAMAN_TERMINAL_ID: process.env.SAMAN_TERMINAL_ID,
  SAMAN_MERCHANT_ID: process.env.SAMAN_MERCHANT_ID,
  SAMAN_CALLBACK_URL: process.env.SAMAN_CALLBACK_URL,
  PAYMENT_TAX_RATE: process.env.PAYMENT_TAX_RATE,
  WALLET_MIN_WITHDRAWAL: process.env.WALLET_MIN_WITHDRAWAL,
  ORDER_PAYMENT_TIMEOUT_MINUTES: process.env.ORDER_PAYMENT_TIMEOUT_MINUTES,
  APP_BASE_URL: process.env.APP_BASE_URL
};

const parsed = envSchema.parse(rawEnv);

const defaultPort = parsed.PORT ?? 3000;

export const env = {
  ...parsed,
  PORT: defaultPort,
  /** همیشه از process.env خوانده می‌شود — در build ذخیره نمی‌شود */
  get MONGODB_URI() {
    return (process.env.MONGODB_URI || '').trim() || DEFAULT_MONGODB_URI;
  },
  APP_BASE_URL: parsed.APP_BASE_URL ?? `http://localhost:${defaultPort}`
};
