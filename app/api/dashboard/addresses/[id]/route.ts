import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { parseAddressUpdateBody } from '@/lib/dashboard/address-schema';
import { UserAddress } from '@/models';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = parseAddressUpdateBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await connectToDatabase();
  if (parsed.data.isDefault) await UserAddress.updateMany({ userId: user.userId }, { isDefault: false });

  const data = { ...parsed.data } as Record<string, unknown>;
  const unset: Record<string, 1> = {};
  if (data.latitude === null) {
    unset.latitude = 1;
    delete data.latitude;
  }
  if (data.longitude === null) {
    unset.longitude = 1;
    delete data.longitude;
  }

  const update: Record<string, unknown> = { ...data };
  if (Object.keys(unset).length) update.$unset = unset;

  const item = await UserAddress.findOneAndUpdate({ _id: id, userId: user.userId }, update, { new: true });
  if (!item) return NextResponse.json({ error: 'آدرس یافت نشد' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await connectToDatabase();
  await UserAddress.findOneAndDelete({ _id: id, userId: user.userId });
  return NextResponse.json({ ok: true });
}
