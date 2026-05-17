import { NextResponse } from 'next/server';
import { Coupon } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params; const b = await req.json(); await connectToDatabase();
  const item = await Coupon.findByIdAndUpdate(id, { ...b, code: b.code ? String(b.code).toUpperCase() : undefined }, { new: true });
  return NextResponse.json({ item });
}
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params; await connectToDatabase(); await Coupon.findByIdAndDelete(id); return NextResponse.json({ ok: true });
}
