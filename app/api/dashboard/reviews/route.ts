import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Review } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const items = await Review.find({ userId: user.userId, isDeleted: false }).populate('productId', 'name slug').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, comment, rating } = await req.json();
  await connectToDatabase();
  const item:any = await Review.findOne({ _id: id, userId: user.userId, status: 'PENDING', isDeleted: false });
  if (!item) return NextResponse.json({ error: 'این نظر قابل ویرایش نیست.' }, { status: 400 });
  item.title = title; item.comment = comment; item.rating = rating; await item.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  await connectToDatabase();
  await Review.findOneAndUpdate({ _id: id, userId: user.userId, status: 'PENDING' }, { isDeleted: true });
  return NextResponse.json({ ok: true });
}
