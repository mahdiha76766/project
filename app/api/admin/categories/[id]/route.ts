import { NextResponse } from 'next/server';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireCatalog } from '@/lib/api/guards';
import { slugify } from '@/lib/utils/slugify';

async function guard() {
  const auth = await requireCatalog();
  return Boolean(auth.user);
}
const normalizeImage = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image;
  return `/${image}`;
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  await connectToDatabase();
  const payload = {
    name: body.name,
    slug: slugify(body.slug || body.name || ''),
    description: body.description || '',
    image: normalizeImage(body.image),
    parent: body.parent || null,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    seoTitle: String(body.seoTitle || '').trim(),
    seoDescription: String(body.seoDescription || '').trim(),
    isActive: body.isActive ?? true
  };
  const item = await Category.findByIdAndUpdate(id, payload, { new: true });
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
