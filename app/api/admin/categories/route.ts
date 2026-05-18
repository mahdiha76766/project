import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

async function guard() { const user = await getSessionUser(); return user && hasMinimumRole(user.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const items = await Category.find().populate('parent', 'name').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  await connectToDatabase();
  const item = await Category.create({
    name: body.name,
    slug: slugify(body.slug || body.name),
    description: body.description || '',
    image: body.image || '',
    parent: body.parent || null,
    isActive: body.isActive ?? true
  });
  return NextResponse.json({ item }, { status: 201 });
}
