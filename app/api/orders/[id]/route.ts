import { NextResponse } from 'next/server';
import { Order } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const { id } = await params;
  const order = await Order.findOne({ _id: id, user: user.userId }).populate('items.product');
  if (!order) return NextResponse.json({ error: 'سفارش یافت نشد' }, { status: 404 });
  return NextResponse.json(order);
}
