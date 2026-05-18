import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { UserAddress } from '@/models';

const schema = z.object({ recipientName: z.string().min(2), phone: z.string().min(8), province: z.string().min(2), city: z.string().min(2), addressLine: z.string().min(5), postalCode: z.string().min(5), plaque: z.string().optional(), unit: z.string().optional(), isDefault: z.boolean().optional() });

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
  const parsed = schema.parse(await req.json());
  await connectToDatabase();
  if (parsed.isDefault) await UserAddress.updateMany({ userId: user.userId }, { isDefault: false });
  const item = await UserAddress.create({ ...parsed, userId: user.userId });
  return NextResponse.json({ item }, { status: 201 });
}
