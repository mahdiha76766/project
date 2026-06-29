import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

const optionalShortText = (max: number) => z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));
const optionalMinText = (min: number) => z.string().trim().min(min).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));

const mediaItemSchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  url: z.string().trim().min(1),
  poster: z.string().trim().optional()
});

const blogUpdateSchema = z.object({
  title: z.string().trim().min(3).optional(),
  slug: optionalShortText(200),
  excerpt: optionalShortText(300),
  coverImage: optionalShortText(500000),
  content: z.string().trim().min(20).optional(),
  category: optionalMinText(2),
  tags: z.array(z.string().trim()).optional(),
  author: optionalMinText(2),
  seoMetaTitle: optionalShortText(120),
  seoMetaDescription: optionalShortText(180),
  relatedProductIds: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  media: z.array(mediaItemSchema).optional()
});

async function guard() { const u = await getSessionUser(); return u && hasMinimumRole(u.role, 'ADMIN'); }

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const result = blogUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
  }
  const parsed = result.data;
  await connectToDatabase();

  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(parsed)) {
    // only include defined values
    const val = (parsed as any)[key];
    if (val !== undefined) payload[key] = val;
  }
  if (parsed.slug) payload.slug = slugify(parsed.slug);
  if (!parsed.slug && parsed.title) payload.slug = slugify(parsed.title);
  if (parsed.isPublished === true) payload.publishedAt = new Date();

  const item = await BlogPost.findByIdAndUpdate(id, payload, { new: true });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await connectToDatabase();
  await BlogPost.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
