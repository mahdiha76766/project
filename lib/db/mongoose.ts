import mongoose from 'mongoose';
import { logError, logInfo } from '@/lib/monitoring/logger';
import {
  maskMongoUri,
  resolveMongoUri,
  serializeMongoError
} from '@/lib/db/mongo-config';

declare global {
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export { maskMongoUri, parseDbNameFromUri } from '@/lib/db/mongo-config';

export const connectToDatabase = async () => {
  if (cache.conn) {
    logInfo('db.connect.cache_hit', {
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName ?? null
    });
    return cache.conn;
  }

  const resolved = resolveMongoUri();

  logInfo('db.connect.start', {
    source: resolved.source,
    uriMasked: maskMongoUri(resolved.uri),
    dbName: resolved.dbName ?? null,
    host: resolved.host ?? null,
    authSourceAdded: resolved.authSourceAdded,
    nodeEnv: process.env.NODE_ENV ?? null
  });

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(resolved.uri, {
        ...(resolved.dbName ? { dbName: resolved.dbName } : {}),
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
        socketTimeoutMS: 15_000,
        bufferCommands: false
      })
      .then(async (m) => {
        const activeDb = m.connection.db?.databaseName ?? resolved.dbName ?? '(unknown)';
        const ping = await m.connection.db?.admin().ping().catch((err) => {
          logError('db.connect.ping_failed', serializeMongoError(err));
          return null;
        });

        logInfo('db.connect.success', {
          uriMasked: maskMongoUri(resolved.uri),
          dbName: activeDb,
          host: resolved.host ?? null,
          readyState: m.connection.readyState,
          pingOk: Boolean(ping)
        });
        return m;
      })
      .catch((error) => {
        cache.promise = null;
        logError('db.connect.failed', {
          uriMasked: maskMongoUri(resolved.uri),
          dbName: resolved.dbName ?? null,
          host: resolved.host ?? null,
          source: resolved.source,
          ...serializeMongoError(error)
        });
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};
