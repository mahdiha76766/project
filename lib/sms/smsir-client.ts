const BASE_URL = 'https://api.sms.ir/v1';

export type SmsIrResponse<T = unknown> = {
  status: number;
  message: string;
  data: T;
};

export type VerifySendPayload = {
  mobile: string;
  templateId: number;
  parameters: { name: string; value: string }[];
};

export type BulkSendPayload = {
  lineNumber: string | number;
  messageText: string;
  mobiles: string[];
  sendDateTime?: number | null;
};

export class SmsIrClient {
  constructor(private apiKey: string) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<SmsIrResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': this.apiKey
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const json = (await res.json().catch(() => ({}))) as SmsIrResponse<T>;
    if (!res.ok && !json.message) {
      throw new Error(`SMS.ir HTTP ${res.status}`);
    }
    return json;
  }

  async getCredit() {
    return this.request<number>('GET', '/credit');
  }

  async getLines() {
    return this.request<(string | number)[]>('GET', '/line');
  }

  async sendVerify(payload: VerifySendPayload) {
    return this.request<{ messageId: number; cost: number }>('POST', '/send/verify', payload);
  }

  async sendBulk(payload: BulkSendPayload) {
    return this.request<{ packId: string; messageIds: number[]; cost: number }>('POST', '/send/bulk', payload);
  }

  async getMessageStatus(messageId: number) {
    return this.request('GET', `/send/${messageId}`);
  }
}

/** فرمت موبایل برای SMS.ir — 912xxxxxxx */
export function toSmsIrMobile(mobile: string): string {
  let d = mobile.replace(/\D/g, '');
  if (d.startsWith('98')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}
