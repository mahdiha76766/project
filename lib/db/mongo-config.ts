/** آدرس پیش‌فرض دیتابیس production — فقط اگر MONGODB_URI در env نباشد */
export const DEFAULT_MONGODB_URI =
  'mongodb://nedicon1_web:ZaminKavan1388@212.33.203.189:27017/nedicon1_web';

export function parseDbNameFromUri(uri: string): string | undefined {
  const base = uri.split('?')[0];
  const slash = base.lastIndexOf('/');
  if (slash < 0 || slash === base.length - 1) return undefined;
  const name = base.slice(slash + 1);
  if (!name || name.includes('@')) return undefined;
  return name;
}

export function maskMongoUri(uri: string): string {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

export function parseMongoHost(uri: string): string | undefined {
  const m = uri.match(/@([^/?:]+)/);
  return m?.[1];
}

/** اگر authSource در URI نباشد، با نام دیتابیس اضافه می‌شود */
export function ensureAuthSource(uri: string, dbName?: string): string {
  if (!dbName || /[?&]authSource=/i.test(uri)) return uri;
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}authSource=${encodeURIComponent(dbName)}`;
}

export type MongoUriResolved = {
  uri: string;
  dbName: string | undefined;
  host: string | undefined;
  source: 'env' | 'default';
  authSourceAdded: boolean;
};

export function resolveMongoUri(): MongoUriResolved {
  const raw = (process.env.MONGODB_URI || '').trim() || DEFAULT_MONGODB_URI;
  const source = (process.env.MONGODB_URI || '').trim() ? 'env' : 'default';
  const dbName = parseDbNameFromUri(raw);
  const withAuth = ensureAuthSource(raw, dbName);
  return {
    uri: withAuth,
    dbName,
    host: parseMongoHost(raw),
    source,
    authSourceAdded: withAuth !== raw
  };
}

export function serializeMongoError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }
  const e = error as Record<string, unknown>;
  const out: Record<string, unknown> = {
    name: e.name,
    message: e.message,
    code: e.code,
    codeName: e.codeName
  };
  if ('errorResponse' in e && e.errorResponse) out.errorResponse = e.errorResponse;
  if (error instanceof Error && error.stack) out.stack = error.stack.split('\n').slice(0, 6).join('\n');
  return out;
}
