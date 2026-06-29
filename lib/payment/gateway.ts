export type InitiateParams = {
  resNum: string;
  amount: number;
  callbackUrl: string;
  mobile?: string;
  description?: string;
};

export type InitiateResult = {
  redirectUrl: string;
  token?: string;
};

export type VerifyParams = {
  resNum: string;
  refNum?: string;
  state?: string;
  amount: number;
  raw?: Record<string, string>;
};

export type VerifyResult = {
  success: boolean;
  refNum?: string;
  affectiveAmount?: number;
  message?: string;
  raw?: unknown;
};

export interface PaymentGateway {
  readonly name: string;
  initiate(params: InitiateParams): Promise<InitiateResult>;
  verify(params: VerifyParams): Promise<VerifyResult>;
}
