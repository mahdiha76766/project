import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

export const env = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  NODE_ENV: process.env.NODE_ENV
});
