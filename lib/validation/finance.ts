import { z } from 'zod';

export const payInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  method: z.enum(['wallet', 'gateway', 'mixed']).default('gateway')
});

export const walletDepositSchema = z.object({
  amount: z.coerce.number().min(1000)
});

export const walletWithdrawSchema = z.object({
  amount: z.coerce.number().min(1),
  bankInfo: z
    .object({
      accountNumber: z.string().optional(),
      iban: z.string().optional(),
      accountHolder: z.string().optional()
    })
    .optional()
});

export const walletTransferSchema = z.object({
  toMobile: z.string().min(10),
  amount: z.coerce.number().min(1),
  description: z.string().optional()
});
