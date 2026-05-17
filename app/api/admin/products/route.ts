import { NextResponse } from 'next/server';
import { Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

async function guard() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return null;
  return user;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const items = await Product.find().populate('category', 'name').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  await connectToDatabase();
  const created = await Product.create({
    name: body.name,
    slug: slugify(body.slug || body.name),
    shortDescription: body.shortDescription,
    fullDescription: body.fullDescription || '',
    category: body.category,
    images: body.images || [],
    price: Number(body.price || 0),
    discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
    stock: Number(body.stock || 0),
    sku: body.sku || undefined,
    unit: body.unit || 'piece',
    attributes: body.attributes || {},
    tags: body.tags || [],
    isActive: body.isActive ?? true,
    isFeatured: body.isFeatured ?? false
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
