import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { parseAddressBody } from '@/lib/dashboard/address-schema';
import { UserAddress } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();
  const items = await UserAddress.find({ userId: user.userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = parseAddressBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await connectToDatabase();
  if (parsed.data.isDefault) await UserAddress.updateMany({ userId: user.userId }, { isDefault: false });
  const item = await UserAddress.create({ ...parsed.data, userId: user.userId });
  return NextResponse.json({ item }, { status: 201 });
}
