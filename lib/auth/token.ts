const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

const isWebCryptoAvailable = typeof globalThis?.crypto?.subtle !== 'undefined';

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

const base64UrlToUint8Array = (b64url: string) => {
  // convert base64url to base64
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined' && Buffer.from) {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  // atob supported in edge
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

export const signToken = async (payload: Record<string, string | number>) => {
  const data = (typeof Buffer !== 'undefined' && Buffer.from)
    ? Buffer.from(JSON.stringify(payload)).toString('base64url')
    : (() => {
        const s = JSON.stringify(payload);
        return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      })();

  if (isWebCryptoAvailable) {
    const enc = new TextEncoder();
    const keyData = enc.encode(SECRET);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const sig = bytesToBase64Url(toUint8Array(sigBuf));
    return `${data}.${sig}`;
  }

  // Node.js fallback (dynamically import to avoid bundling in edge runtime)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = await import('crypto');
  const sig = nodeCrypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
};

export const verifyToken = async <T>(token: string): Promise<T | null> => {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;

  if (isWebCryptoAvailable) {
    const enc = new TextEncoder();
    const keyData = enc.encode(SECRET);
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expectedBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const expected = bytesToBase64Url(toUint8Array(expectedBuf));
    if (expected !== sig) return null;
    const json = (typeof Buffer !== 'undefined' && Buffer.from)
      ? Buffer.from(data, 'base64url').toString('utf8')
      : decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
    return JSON.parse(json) as T;
  }

  const nodeCrypto = await import('crypto');
  const expected = nodeCrypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (expected !== sig) return null;
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
};
