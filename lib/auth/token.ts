import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

export const signToken = (payload: Record<string, string | number>) => {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
};

export const verifyToken = <T>(token: string): T | null => {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (expected !== sig) return null;
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
};
