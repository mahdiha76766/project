import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { slugify } from '@/lib/utils/slugify';

const optionalShortText = (max: number) => z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));
const optionalMinText = (min: number) => z.string().trim().min(min).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));

const blogInputSchema = z.object({
  title: z.string().trim().min(3),
  slug: optionalShortText(200),
  excerpt: optionalShortText(300),
  coverImage: optionalShortText(500000),
  content: z.string().trim().min(20),
  category: optionalMinText(2),
  tags: z.array(z.string().trim()).optional(),
  author: optionalMinText(2),
  seoMetaTitle: optionalShortText(120),
  seoMetaDescription: optionalShortText(180),
  relatedProductIds: z.array(z.string()).optional(),
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
    category: parsed.category || 'عمومی',
    tags: parsed.tags || [],
    author: parsed.author || 'تیم محتوای عصاره طبیعت',
    seoMetaTitle: parsed.seoMetaTitle || '',
    seoMetaDescription: parsed.seoMetaDescription || '',
    relatedProductIds: parsed.relatedProductIds || [],
    isPublished: parsed.isPublished ?? true,
    publishedAt: parsed.isPublished === false ? undefined : new Date()
  });
  return NextResponse.json({ item }, { status: 201 });
}
