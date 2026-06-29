import { env } from '@/server/config/env';
import type { InitiateParams, InitiateResult, PaymentGateway, VerifyParams, VerifyResult } from '@/lib/payment/gateway';

export class MockGateway implements PaymentGateway {
  readonly name = 'MOCK';

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    const base = env.APP_BASE_URL ?? 'http://localhost:3000';
    const redirectUrl = `${base}/api/payment/verify?ResNum=${encodeURIComponent(params.resNum)}&State=OK&RefNum=MOCK-${params.resNum}&Amount=${params.amount}`;
    return { redirectUrl, token: `MOCK-TOKEN-${params.resNum}` };
  }

  async verify(params: VerifyParams): Promise<VerifyResult> {
    const state = (params.state ?? params.raw?.State ?? '').toUpperCase();
    const success = state === 'OK' || state === '1' || state === 'SUCCESS';
    const refNum = params.refNum ?? params.raw?.RefNum ?? `MOCK-${params.resNum}`;
    const affectiveAmount = Number(params.raw?.Amount ?? params.amount);
    return {
      success,
      refNum,
      affectiveAmount,
      message: success ? 'پرداخت موفق (Mock)' : 'پرداخت ناموفق (Mock)',
      raw: params.raw
    };
  }
}
