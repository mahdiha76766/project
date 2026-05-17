import { NextResponse } from 'next/server';
import { ShippingMethod } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const items = await ShippingMethod.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json(); await connectToDatabase();
  const item = await ShippingMethod.create({
    code: String(b.code || '').trim().toUpperCase(),
    name: b.name,
    baseCost: Number(b.baseCost || 0),
    estimatedDays: Number(b.estimatedDays || 1),
    cityOnly: Boolean(b.cityOnly),
    freeAboveAmount: b.freeAboveAmount ? Number(b.freeAboveAmount) : 0,
    isActive: b.isActive ?? true
  });
  return NextResponse.json({ item }, { status: 201 });
}
