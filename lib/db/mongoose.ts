import mongoose from 'mongoose';
import { env } from '@/server/config/env';

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export const connectToDatabase = async () => {
  if (cache.conn) return cache.conn;

  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: 'shop_db',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        bufferCommands: false
      })
      .then((m) => m)
      .catch((error) => {
        cache.promise = null;
        console.error('[db][mongoose] Connection error:', error);
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
