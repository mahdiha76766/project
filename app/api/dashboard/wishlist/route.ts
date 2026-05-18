import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Product, Wishlist } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const row:any = await Wishlist.findOne({ user: user.userId }).populate('products', 'name slug price discountPrice images stock').lean();
  return NextResponse.json({ items: row?.products || [] });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await req.json();
  await connectToDatabase();
  const exists = await Product.findById(productId).select('_id');
  if (!exists) return NextResponse.json({ error: 'محصول نامعتبر است.' }, { status: 400 });
  const row = await Wishlist.findOneAndUpdate({ user: user.userId }, { $addToSet: { products: productId } }, { new: true, upsert: true });
  return NextResponse.json({ ok: true, count: row.products.length });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { productId } = await req.json();
  await connectToDatabase();
  await Wishlist.findOneAndUpdate({ user: user.userId }, { $pull: { products: productId } });
  return NextResponse.json({ ok: true });
}
