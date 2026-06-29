import { Schema, model, models } from 'mongoose';
import { INVOICE_STATUSES, INVOICE_TYPES } from '@/constants/invoice';

const InvoiceItemSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    metadata: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const RelatedEntitySchema = new Schema(
  {
    type: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true }
  },
  { _id: false }
);

const PartyInfoSchema = new Schema(
  {
    name: String,
    mobile: String,
    email: String,
    nationalId: String,
    address: String
  },
  { _id: false }
);

export const Invoice = models.Invoice || model(
  'Invoice',
  new Schema(
    {
      invoiceNumber: { type: String, required: true, unique: true, index: true },
      proformaNumber: { type: String, sparse: true, unique: true },
      formalNumber: { type: String, sparse: true, unique: true },
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
      type: { type: String, enum: INVOICE_TYPES, required: true, index: true },
      status: { type: String, enum: INVOICE_STATUSES, default: 'pending', index: true },
      items: { type: [InvoiceItemSchema], default: [] },
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      relatedEntity: { type: RelatedEntitySchema },
      paymentId: { type: Schema.Types.ObjectId, ref: 'FinancePayment' },
      paidAt: Date,
      buyerInfo: { type: PartyInfoSchema, default: {} },
      sellerInfo: { type: PartyInfoSchema, default: {} },
      notes: { type: String, default: '' },
      expiresAt: { type: Date, index: true }
    },
    { timestamps: true }
  )
);

export const InvoiceSequence = models.InvoiceSequence || model(
  'InvoiceSequence',
  new Schema(
    {
      key: { type: String, required: true, unique: true },
      prefix: { type: String, required: true },
      year: { type: Number, required: true },
      seq: { type: Number, default: 0 }
    },
    { timestamps: true }
  )
);
