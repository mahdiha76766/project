const isWebCryptoAvailable = typeof globalThis?.crypto?.subtle !== 'undefined';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function resolveAuthSecret(): string | null {
  const fromEnv = String(process.env.AUTH_SECRET || '').trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') return null;
  return 'dev-secret-change-me';
}

const toUint8Array = (buf: ArrayBuffer | Uint8Array) =>
  buf instanceof Uint8Array ? buf : new Uint8Array(buf);

const bytesToBase64Url = (bytes: Uint8Array) => {
  if (typeof Buffer !== 'undefined' && Buffer.from) {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const isExpired = (exp: unknown) => {
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return false;
  const expMs = exp > 1e12 ? exp : exp * 1000;
  return expMs < Date.now();
};

export const signToken = async (payload: Record<string, string | number>) => {
  const secret = resolveAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is required in production.');
  }

  const nextPayload =
    payload.exp == null
      ? { ...payload, iat: Math.floor(Date.now() / 1000), exp: Date.now() + SESSION_TTL_MS }
      : payload;

  const data =
    typeof Buffer !== 'undefined' && Buffer.from
      ? Buffer.from(JSON.stringify(nextPayload)).toString('base64url')
      : (() => {
          const s = JSON.stringify(nextPayload);
          return btoa(unescape(encodeURIComponent(s)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        })();

  if (isWebCryptoAvailable) {
    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const sig = bytesToBase64Url(toUint8Array(sigBuf));
    return `${data}.${sig}`;
  }

  const nodeCrypto = await import('crypto');
  const sig = nodeCrypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
};

export const verifyToken = async <T>(token: string): Promise<T | null> => {
  const secret = resolveAuthSecret();
  if (!secret) return null;

  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  try {
    if (isWebCryptoAvailable) {
      const enc = new TextEncoder();
      const keyData = enc.encode(secret);
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const expectedBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
      const expected = bytesToBase64Url(toUint8Array(expectedBuf));
      if (expected !== sig) return null;
      const json =
        typeof Buffer !== 'undefined' && Buffer.from
          ? Buffer.from(data, 'base64url').toString('utf8')
          : decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
      const parsed = JSON.parse(json) as T & { exp?: number };
      if (isExpired(parsed.exp)) return null;
      return parsed as T;
    }

    const nodeCrypto = await import('crypto');
    const expected = nodeCrypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (expected !== sig) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T & { exp?: number };
    if (isExpired(parsed.exp)) return null;
    return parsed as T;
  } catch {
    return null;
  }
};
