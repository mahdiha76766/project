export const TRANSACTION_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'REFUND',
  'CASHBACK',
  'GIFT',
  'ORDER_PAYMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'HOLD',
  'RELEASE'
] as const;

export const WALLET_HOLD_STATUSES = ['ACTIVE', 'CAPTURED', 'RELEASED', 'EXPIRED'] as const;

export const WITHDRAWAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'] as const;

export const PAYMENT_TYPES = ['order', 'wallet_topup'] as const;

export const PAYMENT_PROVIDERS = ['MOCK', 'SEP', 'ZARINPAL', 'IDPAY', 'NEXTPAY', 'CARD_TO_CARD'] as const;

export const FINANCE_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type WalletHoldStatus = (typeof WALLET_HOLD_STATUSES)[number];
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];
export type FinancePaymentStatus = (typeof FINANCE_PAYMENT_STATUSES)[number];
