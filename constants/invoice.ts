export const INVOICE_TYPES = ['order', 'wallet_topup'] as const;

export const INVOICE_STATUSES = ['draft', 'pending', 'paid', 'cancelled', 'refunded'] as const;

export type InvoiceType = (typeof INVOICE_TYPES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
