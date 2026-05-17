import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const nodeEnv = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

// Use a local MongoDB URI for development/testing when one isn't provided.
// In production this will remain undefined and the schema will throw.
const mongoUri = process.env.MONGODB_URI ?? (nodeEnv === 'production' ? undefined : 'mongodb://127.0.0.1:27017/nextjs-shop-architecture');

export const env = envSchema.parse({
  MONGODB_URI: mongoUri,
  NODE_ENV: nodeEnv
});
