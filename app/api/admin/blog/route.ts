import { NextResponse } from 'next/server';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ items: await BlogPost.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json(); await connectToDatabase();
  const item = await BlogPost.create({ title: b.title, slug: slugify(b.slug || b.title), content: b.content || '', isPublished: b.isPublished ?? true, publishedAt: b.isPublished ? new Date() : undefined });
  return NextResponse.json({ item }, { status: 201 });
}
