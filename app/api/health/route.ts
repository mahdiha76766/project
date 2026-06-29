import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { env } from '@/server/config/env';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  maskMongoUri,
  resolveMongoUri,
  serializeMongoError
} from '@/lib/db/mongo-config';
import { logError, logInfo } from '@/lib/monitoring/logger';

export async function GET() {
  const resolved = resolveMongoUri();
  const uri = env.MONGODB_URI;

  let mongo: {
    status: 'connected' | 'disconnected' | 'error';
    dbName?: string;
    error?: string;
    code?: number;
    codeName?: string;
    pingOk?: boolean;
  } = { status: 'disconnected' };

  try {
    logInfo('health.mongo.check', {
      source: resolved.source,
      uriMasked: maskMongoUri(resolved.uri),
      dbName: resolved.dbName ?? null
    });

    await connectToDatabase();

    const ping = await mongoose.connection.db?.admin().ping().catch(() => null);
    mongo = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbName: mongoose.connection.db?.databaseName ?? resolved.dbName,
      pingOk: Boolean(ping)
    };

    logInfo('health.mongo.ok', {
      dbName: mongo.dbName ?? null,
      readyState: mongoose.connection.readyState,
      pingOk: mongo.pingOk
    });
  } catch (e) {
    const err = serializeMongoError(e);
    mongo = {
      status: 'error',
      dbName: resolved.dbName,
      error: String(err.message ?? 'unknown'),
      code: typeof err.code === 'number' ? err.code : undefined,
      codeName: typeof err.codeName === 'string' ? err.codeName : undefined
    };
    logError('health.mongo.failed', {
      uriMasked: maskMongoUri(resolved.uri),
      dbName: resolved.dbName ?? null,
      ...err
    });
  }

  return NextResponse.json({
    ok: mongo.status === 'connected',
    service: 'shop-web',
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? env.NODE_ENV,
    mongo: {
      ...mongo,
      source: resolved.source,
      uriMasked: uri ? maskMongoUri(uri) : maskMongoUri(resolved.uri),
      dbFromUri: resolved.dbName ?? null,
      host: resolved.host ?? null,
      authSourceAdded: resolved.authSourceAdded
    }
  });
}
