import { NextResponse } from 'next/server';
import { Order, Payment } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function POST(req: Request) {
  await connectToDatabase();
  const { orderId, paymentId, success, transactionId } = await req.json();
  const paymentStatus = success ? 'PAID' : 'FAILED';
  await Payment.updateOne({ _id: paymentId }, { $set: { status: paymentStatus, transactionId, paidAt: success ? new Date() : null } });
  await Order.updateOne({ _id: orderId }, { $set: { paymentStatus, orderStatus: success ? 'PAID' : 'PENDING_PAYMENT' } });
  return NextResponse.json({ redirectUrl: `/payment/result?orderId=${orderId}&status=${success ? 'paid' : 'failed'}` });
}
