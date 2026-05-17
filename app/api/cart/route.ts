import { NextResponse } from 'next/server';
import { Cart } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [] });
  await connectToDatabase();
  const cart = await Cart.findOne({ user: user.userId }).populate('items.product');
  return NextResponse.json(cart || { items: [] });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const { productId, quantity, weight, volume } = await req.json();
  const cart = await Cart.findOneAndUpdate(
    { user: user.userId },
    { $setOnInsert: { user: user.userId }, $push: { items: { product: productId, quantity, weight, volume } } },
    { upsert: true, new: true }
  );
  return NextResponse.json(cart);
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const { productId, quantity } = await req.json();
  await Cart.updateOne({ user: user.userId, 'items.product': productId }, { $set: { 'items.$.quantity': quantity } });
  const cart = await Cart.findOne({ user: user.userId });
  return NextResponse.json(cart);
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const { productId } = await req.json();
  await Cart.updateOne({ user: user.userId }, { $pull: { items: { product: productId } } });
  return NextResponse.json({ ok: true });
}
