import { env } from '@/server/config/env';
import { MockGateway } from '@/lib/payment/mock-gateway';
import { SepGateway } from '@/lib/payment/sep-gateway';
import type { PaymentGateway } from '@/lib/payment/gateway';

let mockInstance: MockGateway | null = null;
let sepInstance: SepGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (env.NODE_ENV === 'production') {
    if (!sepInstance) sepInstance = new SepGateway();
    return sepInstance;
  }
  if (!mockInstance) mockInstance = new MockGateway();
  return mockInstance;
}

export function getPaymentGatewayByName(name: string): PaymentGateway {
  if (name === 'SEP') {
    if (!sepInstance) sepInstance = new SepGateway();
    return sepInstance;
  }
  if (!mockInstance) mockInstance = new MockGateway();
  return mockInstance;
}
