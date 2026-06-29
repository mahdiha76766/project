import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { previewInvoice } from '@/lib/invoice/invoice-service';

export async function GET(_req: Request, { params }: { params: Promise<{ invoiceNumber: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { invoiceNumber } = await params;
  await connectToDatabase();
  try {
    const invoice = await previewInvoice(invoiceNumber, auth.user.userId);
    return NextResponse.json({ invoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'فاکتور یافت نشد';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
