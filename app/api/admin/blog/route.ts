import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

const blogInputSchema = z.object({
  title: z.string().trim().min(3),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().max(300).optional(),
  coverImage: z.string().trim().min(0).max(500000).optional(),
  content: z.string().trim().min(20),
  isPublished: z.boolean().optional()
});

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  return NextResponse.json({ items: await BlogPost.find().sort({ createdAt: -1 }).lean() });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = blogInputSchema.parse(await req.json());
  await connectToDatabase();
  const postSlug = slugify(parsed.slug || parsed.title);
  const item = await BlogPost.create({
    title: parsed.title,
    slug: postSlug,
    excerpt: parsed.excerpt || '',
    coverImage: parsed.coverImage || '',
    content: parsed.content,
    isPublished: parsed.isPublished ?? true,
    publishedAt: parsed.isPublished === false ? undefined : new Date()
  });
  return NextResponse.json({ item }, { status: 201 });
}
