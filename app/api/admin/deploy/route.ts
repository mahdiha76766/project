import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Setting } from '@/models';
import { defaultDeployConfig, DEPLOY_CONFIG_KEY, type DeployConfig } from '@/lib/admin/deploy-config';
import { env } from '@/server/config/env';
import { maskMongoUri, resolveMongoUri } from '@/lib/db/mongo-config';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

function mergeConfig(raw: unknown): DeployConfig {
  const base = { ...defaultDeployConfig };
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<DeployConfig>;
  return {
    port: Number(r.port) > 0 ? Number(r.port) : base.port,
    nodeEnv: r.nodeEnv === 'development' ? 'development' : 'production',
    authSecret: String(r.authSecret || base.authSecret).trim(),
    appBaseUrl: String(r.appBaseUrl || base.appBaseUrl).trim(),
    publicSiteUrl: String(r.publicSiteUrl || base.publicSiteUrl).trim(),
    samanTerminalId: String(r.samanTerminalId || '').trim(),
    samanMerchantId: String(r.samanMerchantId || '').trim(),
    samanTerminalPass: String(r.samanTerminalPass || '').trim(),
    samanCallbackUrl: String(r.samanCallbackUrl || base.samanCallbackUrl).trim(),
    cronSecret: String(r.cronSecret || '').trim(),
    orderPaymentTimeoutMinutes: Number(r.orderPaymentTimeoutMinutes) || base.orderPaymentTimeoutMinutes,
    walletMinWithdrawal: Number(r.walletMinWithdrawal) || base.walletMinWithdrawal,
    paymentTaxRate: Number(r.paymentTaxRate) ?? base.paymentTaxRate
  };
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();

  const row = await Setting.findOne({ key: DEPLOY_CONFIG_KEY }).lean() as { value?: unknown } | null;
  const config = mergeConfig(row?.value);

  let mongoStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  try {
    mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch {
    mongoStatus = 'error';
  }

  const mongoResolved = resolveMongoUri();

  return NextResponse.json({
    config,
    runtime: {
      port: Number(process.env.PORT || 3000),
      nodeEnv: process.env.NODE_ENV || 'production',
      mongoStatus,
      hasMongoUri: Boolean(mongoResolved.uri),
      mongoUriMasked: maskMongoUri(mongoResolved.uri),
      mongoDbFromUri: mongoResolved.dbName ?? null,
      mongoHost: mongoResolved.host ?? null,
      mongoSource: mongoResolved.source,
      mongoDbActive: mongoose.connection.db?.databaseName ?? null,
      hasAuthSecret: Boolean(process.env.AUTH_SECRET),
      hasAppBaseUrl: Boolean(process.env.APP_BASE_URL || env.APP_BASE_URL),
      hasPublicSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      hasSaman: Boolean(process.env.SAMAN_TERMINAL_ID && process.env.SAMAN_MERCHANT_ID)
    }
  });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const config = mergeConfig(body.config);

  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: DEPLOY_CONFIG_KEY },
    { value: config },
    { upsert: true, new: true }
  );

  return NextResponse.json({ config, message: 'تنظیمات استقرار ذخیره شد.' });
}
