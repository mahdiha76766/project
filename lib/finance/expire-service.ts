import { FinancePayment, Invoice, Order, WalletHold, PaymentReceipt } from '@/models';
import { cancelInvoice } from '@/lib/invoice/invoice-service';
import { releaseHold } from '@/lib/finance/wallet-service';

export async function expireStalePayments() {
  const now = new Date();
  const expiredInvoices = await Invoice.find({ status: 'pending', expiresAt: { $lt: now } }).limit(100);
  let processed = 0;

  for (const invoice of expiredInvoices) {
    const pendingReceipt = await PaymentReceipt.findOne({
      invoiceNumber: invoice.invoiceNumber,
      status: 'PENDING'
    }).select('_id');
    if (pendingReceipt) continue;

    const pendingPayment = await FinancePayment.findOne({ invoiceNumber: invoice.invoiceNumber, status: 'PENDING' });
    if (pendingPayment?.holdId) {
      try {
        await releaseHold(String(pendingPayment.holdId));
      } catch {
        // hold may already be released
      }
      pendingPayment.status = 'CANCELED';
      pendingPayment.activityLog.push({ action: 'expired', message: 'مهلت پرداخت به پایان رسید', performedAt: new Date() });
      await pendingPayment.save();
    }

    await cancelInvoice(invoice.invoiceNumber);

    if (invoice.type === 'order' && invoice.relatedEntity?.id) {
      await Order.updateOne(
        { _id: invoice.relatedEntity.id, orderStatus: 'PENDING_PAYMENT' },
        { $set: { orderStatus: 'CANCELED', paymentStatus: 'CANCELED' } }
      );
    }
    processed += 1;
  }

  const expiredHolds = await WalletHold.find({ status: 'ACTIVE', expiresAt: { $lt: now } }).limit(100);
  for (const hold of expiredHolds) {
    try {
      await releaseHold(String(hold._id));
      hold.status = 'EXPIRED';
      await hold.save();
      processed += 1;
    } catch {
      // ignore
    }
  }

  return { processed };
}
