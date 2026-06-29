import { Schema, model, models } from 'mongoose';
import {
  FINANCE_PAYMENT_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_TYPES,
  TRANSACTION_TYPES,
  WALLET_HOLD_STATUSES,
  WITHDRAWAL_STATUSES
} from '@/constants/finance';

const ActivityLogSchema = new Schema(
  {
    action: { type: String, required: true },
    message: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed },
    performedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

export const Wallet = models.Wallet || model(
  'Wallet',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
      availableBalance: { type: Number, default: 0, min: 0 },
      blockedBalance: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'IRR' },
      version: { type: Number, default: 0 }
    },
    { timestamps: true }
  )
);

export const WalletTransaction = models.WalletTransaction || model(
  'WalletTransaction',
  new Schema(
    {
      transactionId: { type: String, required: true, unique: true, index: true },
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      type: { type: String, enum: TRANSACTION_TYPES, required: true, index: true },
      amount: { type: Number, required: true, min: 0 },
      balanceBefore: { type: Number, required: true, min: 0 },
      balanceAfter: { type: Number, required: true, min: 0 },
      blockedBefore: { type: Number, default: 0, min: 0 },
      blockedAfter: { type: Number, default: 0, min: 0 },
      referenceType: { type: String, default: '' },
      referenceId: { type: Schema.Types.ObjectId },
      description: { type: String, default: '' },
      idempotencyKey: { type: String, sparse: true, unique: true },
      performedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
  )
);

export const WalletHold = models.WalletHold || model(
  'WalletHold',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      amount: { type: Number, required: true, min: 0 },
      reason: { type: String, default: '' },
      referenceType: { type: String, default: '' },
      referenceId: { type: Schema.Types.ObjectId },
      status: { type: String, enum: WALLET_HOLD_STATUSES, default: 'ACTIVE', index: true },
      paymentId: { type: Schema.Types.ObjectId, ref: 'FinancePayment' },
      expiresAt: { type: Date, index: true }
    },
    { timestamps: true }
  )
);

export const WithdrawalRequest = models.WithdrawalRequest || model(
  'WithdrawalRequest',
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      amount: { type: Number, required: true, min: 0 },
      status: { type: String, enum: WITHDRAWAL_STATUSES, default: 'PENDING', index: true },
      bankInfo: {
        accountNumber: String,
        iban: String,
        accountHolder: String
      },
      adminNote: { type: String, default: '' },
      processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      processedAt: Date
    },
    { timestamps: true }
  )
);

export const AuditLog = models.AuditLog || model(
  'AuditLog',
  new Schema(
    {
      actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
      actorRole: { type: String, default: '' },
      action: { type: String, required: true, index: true },
      entityType: { type: String, required: true, index: true },
      entityId: { type: Schema.Types.ObjectId, index: true },
      metadata: { type: Schema.Types.Mixed },
      ip: { type: String, default: '' }
    },
    { timestamps: true }
  )
);

export const FinancePayment = models.FinancePayment || model(
  'FinancePayment',
  new Schema(
    {
      resNum: { type: String, required: true, unique: true, index: true },
      amount: { type: Number, required: true, min: 0 },
      baseAmount: { type: Number, required: true, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      status: { type: String, enum: FINANCE_PAYMENT_STATUSES, default: 'PENDING', index: true },
      refNum: { type: String, default: '', index: true },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      paymentType: { type: String, enum: PAYMENT_TYPES, required: true },
      invoiceNumber: { type: String, required: true, index: true },
      provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
      orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
      walletAmount: { type: Number, default: 0, min: 0 },
      gatewayAmount: { type: Number, default: 0, min: 0 },
      idempotencyKey: { type: String, sparse: true, unique: true },
      gatewayPayload: { type: Schema.Types.Mixed },
      verifiedAt: Date,
      receiptNumber: { type: String, sparse: true, unique: true },
      activityLog: { type: [ActivityLogSchema], default: [] },
      holdId: { type: Schema.Types.ObjectId, ref: 'WalletHold' }
    },
    { timestamps: true }
  )
);
