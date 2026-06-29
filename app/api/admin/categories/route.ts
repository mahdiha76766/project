import { NextResponse } from 'next/server';
import { Category } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

const normalizeImage = (image?: string) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) return image;
  return `/${image}`;
};

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { all, page, limit, skip } = getPaginationParams(req.url);
  await connectToDatabase();

  if (all) {
    const items = await Category.find().populate('parent', 'name').sort({ name: 1 }).lean();
    return NextResponse.json({ items });
  }

  const [items, total] = await Promise.all([
    Category.find().populate('parent', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Category.countDocuments()
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: 'نام دسته‌بندی الزامی است.' }, { status: 400 });
    await connectToDatabase();
    const item = await Category.create({
      name: body.name.trim(),
      slug: slugify(body.slug || body.name),
      description: body.description || '',
      image: normalizeImage(body.image),
      parent: body.parent || null,
      isActive: body.isActive ?? true
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد دسته‌بندی' }, { status: 400 });
  }
}
