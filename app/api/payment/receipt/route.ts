import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Invoice, Order } from '@/models';
import { createPaymentReceipt } from '@/lib/payment/receipt-service';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const invoiceNumber = String(form.get('invoiceNumber') || '').trim();
    const type = form.get('type') === 'wallet_topup' ? 'wallet_topup' : 'order';
    const useWallet = form.get('useWallet') === 'true';

    if (!file || !invoiceNumber) {
      return NextResponse.json({ error: 'فاکتور و تصویر رسید الزامی است' }, { status: 400 });
    }

    await connectToDatabase();
    const invoice = await Invoice.findOne({ invoiceNumber, user: user.userId });
    if (!invoice) return NextResponse.json({ error: 'فاکتور یافت نشد' }, { status: 404 });

    let orderId: string | undefined;
    if (type === 'order' && invoice.relatedEntity?.type === 'order') {
      orderId = String(invoice.relatedEntity.id);
      const order = await Order.findById(orderId);
      if (!order) return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
    }

    const receipt = await createPaymentReceipt({
      userId: user.userId,
      type,
      invoiceNumber,
      orderId,
      amount: invoice.total,
      file,
      useWallet
    });

    return NextResponse.json({
      ok: true,
      receiptId: receipt._id,
      message: 'رسید با موفقیت ثبت شد. پس از تأیید پشتیبانی، سفارش/شارژ شما فعال می‌شود.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در ثبت رسید';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
