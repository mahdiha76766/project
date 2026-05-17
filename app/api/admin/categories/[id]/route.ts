import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

async function guard() { const user = await getSessionUser(); return user && hasMinimumRole(user.role, 'ADMIN'); }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  await connectToDatabase();
  const item = await Category.findByIdAndUpdate(id, { ...body, slug: body.slug || slugify(body.name || '') }, { new: true });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await Category.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
