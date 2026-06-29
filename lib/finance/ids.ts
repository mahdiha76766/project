import { randomBytes } from 'crypto';

export function generateTransactionId() {
  return `TX-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function generateResNum() {
  return `R-${randomBytes(4).toString('hex').toUpperCase()}`;
}
