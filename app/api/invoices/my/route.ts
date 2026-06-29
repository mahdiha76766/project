import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { listUserInvoices } from '@/lib/invoice/invoice-service';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const url = new URL(req.url);
  const invoices = await listUserInvoices(auth.user.userId, {
    status: url.searchParams.get('status') ?? undefined,
    type: url.searchParams.get('type') ?? undefined
  });
  return NextResponse.json({ invoices });
}
