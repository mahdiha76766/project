import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { UserAddress } from '@/models';

const schema = z.object({ recipientName: z.string().min(2).optional(), phone: z.string().min(8).optional(), province: z.string().min(2).optional(), city: z.string().min(2).optional(), addressLine: z.string().min(5).optional(), postalCode: z.string().min(5).optional(), plaque: z.string().optional(), unit: z.string().optional(), isDefault: z.boolean().optional() });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params; const parsed = schema.parse(await req.json());
  await connectToDatabase();
  if (parsed.isDefault) await UserAddress.updateMany({ userId: user.userId }, { isDefault: false });
  const item = await UserAddress.findOneAndUpdate({ _id: id, userId: user.userId }, parsed, { new: true });
  return NextResponse.json({ item });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params; await connectToDatabase(); await UserAddress.findOneAndDelete({ _id: id, userId: user.userId }); return NextResponse.json({ ok: true });
}
