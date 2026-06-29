import { env } from '@/server/config/env';
import type { InitiateParams, InitiateResult, PaymentGateway, VerifyParams, VerifyResult } from '@/lib/payment/gateway';

const SEP_TOKEN_URL = 'https://sep.shaparak.ir/onlinepg/onlinepg';
const SEP_VERIFY_URL = 'https://verify.sep.ir/Payments/ReferencePayment.asmx?WSDL';
const SEP_PAY_URL = 'https://sep.shaparak.ir/OnlinePG/OnlinePG';

export class SepGateway implements PaymentGateway {
  readonly name = 'SEP';

  private ensureConfig() {
    if (!env.SAMAN_TERMINAL_ID || !env.SAMAN_MERCHANT_ID) {
      throw new Error('تنظیمات درگاه سامان کامل نیست');
    }
  }

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    this.ensureConfig();
    const callbackUrl = env.SAMAN_CALLBACK_URL ?? params.callbackUrl;
    const body = {
      action: 'token',
      TerminalId: env.SAMAN_TERMINAL_ID,
      Amount: params.amount,
      ResNum: params.resNum,
      RedirectUrl: callbackUrl,
      CellNumber: params.mobile ?? ''
    };

    const response = await fetch(SEP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) throw new Error('خطا در ارتباط با درگاه سامان');
    const data = await response.json();
    const token = data?.token ?? data?.Token;
    if (!token) throw new Error(data?.errorDesc ?? 'توکن درگاه دریافت نشد');
    return {
      redirectUrl: `${SEP_PAY_URL}?token=${encodeURIComponent(token)}`,
      token
    };
  }

  async verify(params: VerifyParams): Promise<VerifyResult> {
    this.ensureConfig();
    const refNum = params.refNum ?? params.raw?.RefNum;
    if (!refNum) {
      return { success: false, message: 'RefNum موجود نیست' };
    }

    const state = (params.state ?? params.raw?.State ?? '').toUpperCase();
    if (state && state !== 'OK' && state !== '1') {
      return { success: false, refNum, message: 'پرداخت توسط کاربر لغو یا ناموفق بود' };
    }

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <verifyTransaction xmlns="https://verify.sep.ir/Payments/ReferencePayment.asmx">
      <String_1>${env.SAMAN_TERMINAL_ID}</String_1>
      <String_2>${refNum}</String_2>
    </verifyTransaction>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(SEP_VERIFY_URL.replace('?WSDL', ''), {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'https://verify.sep.ir/Payments/ReferencePayment.asmx/verifyTransaction' },
      body: soapBody,
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) return { success: false, refNum, message: 'خطا در verify درگاه' };
    const text = await response.text();
    const amountMatch = text.match(/<TransactionDetail>[\s\S]*?<AffectiveAmount>(\d+)<\/AffectiveAmount>/i)
      ?? text.match(/<verifyTransactionResult>(\d+)<\/verifyTransactionResult>/i);
    const affectiveAmount = amountMatch ? Number(amountMatch[1]) : undefined;
    const success = affectiveAmount !== undefined && affectiveAmount > 0;

    return {
      success,
      refNum,
      affectiveAmount,
      message: success ? 'پرداخت تأیید شد' : 'تأیید پرداخت ناموفق بود',
      raw: text
    };
  }
}
