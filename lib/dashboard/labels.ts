export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'شارژ کیف پول',
  WITHDRAWAL: 'برداشت',
  REFUND: 'بازگشت وجه',
  CASHBACK: 'کش‌بک',
  GIFT: 'هدیه',
  ORDER_PAYMENT: 'پرداخت سفارش',
  TRANSFER_IN: 'دریافت انتقال',
  TRANSFER_OUT: 'انتقال به دیگران',
  HOLD: 'بلوکه موجودی',
  RELEASE: 'آزادسازی موجودی',
  CARD_TO_CARD_DEPOSIT: 'کارت به کارت — شارژ کیف پول',
  CARD_TO_CARD_ORDER: 'کارت به کارت — پرداخت سفارش'
};

export const INVOICE_TYPE_LABELS: Record<string, string> = {
  order: 'سفارش',
  wallet_topup: 'شارژ کیف پول'
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  cancelled: 'لغو شده',
  refunded: 'بازپرداخت شده'
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  COMPLETED: 'تکمیل شده'
};

export const COUPON_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  USED: 'استفاده‌شده',
  EXPIRED: 'منقضی',
  INACTIVE: 'غیرفعال'
};

export const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export const PAYMENT_RESULT_STATUS_LABELS: Record<string, string> = {
  paid: 'پرداخت موفق',
  failed: 'پرداخت ناموفق',
  pending: 'در انتظار تأیید',
  cancelled: 'لغو شده',
  canceled: 'لغو شده'
};

export const ORDER_PAYMENT_METHOD_LABELS: Record<string, string> = {
  WALLET: 'کیف پول',
  GATEWAY: 'درگاه بانکی',
  MIXED: 'ترکیبی (کیف پول + درگاه)',
  COD: 'پرداخت در محل',
  SEP: 'درگاه سامان',
  CARD_TO_CARD: 'کارت به کارت'
};

export const RECEIPT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار تأیید رسید',
  APPROVED: 'رسید تأیید شده',
  REJECTED: 'رسید رد شده'
};

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  SEP: 'درگاه سامان (SEP)',
  MOCK: 'درگاه آزمایشی',
  CARD_TO_CARD: 'کارت به کارت'
};

export const FINANCE_PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار',
  PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق',
  CANCELED: 'لغو شده',
  CANCELLED: 'لغو شده',
  REFUNDED: 'بازپرداخت شده'
};
