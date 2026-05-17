import mongoose from 'mongoose';
import { env } from '@/server/config/env';

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export const connectToDatabase = async () => {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, { dbName: 'shop_db' }).then((m) => m);
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
