import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const rawEnv = {
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV
};

const parsed = envSchema.parse(rawEnv);

export const env = {
  ...parsed,
  MONGODB_URI: parsed.MONGODB_URI ?? (parsed.NODE_ENV === 'development' ? 'mongodb://127.0.0.1:27017' : undefined)
};
