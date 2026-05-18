import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { ReturnRequest } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const items = await ReturnRequest.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await connectToDatabase();
  const item = await ReturnRequest.create({ userId: user.userId, orderId: body.orderId, reason: body.reason, status: 'PENDING' });
  return NextResponse.json({ item }, { status: 201 });
}
