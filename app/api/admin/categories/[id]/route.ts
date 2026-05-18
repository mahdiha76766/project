import { NextResponse } from 'next/server';
import { Category, Product } from '@/models';
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
  const item = await Category.findByIdAndUpdate(id, { ...body, slug: slugify(body.slug || body.name || '') }, { new: true });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();

  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) return NextResponse.json({ error: 'این دسته‌بندی دارای زیرمجموعه است.' }, { status: 400 });

  const hasProducts = await Product.exists({ category: id });
  if (hasProducts) return NextResponse.json({ error: 'این دسته‌بندی به محصول متصل است.' }, { status: 400 });

  await Category.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
