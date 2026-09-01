import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogPost } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireContent } from '@/lib/api/guards';
import { slugify } from '@/lib/utils/slugify';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

const optionalShortText = (max: number) => z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));
const optionalMinText = (min: number) => z.string().trim().min(min).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v));

const mediaItemSchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  url: z.string().trim().min(1),
  poster: z.string().trim().optional()
});

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
  isPublished: z.boolean().optional(),
  media: z.array(mediaItemSchema).optional()
});

async function guard() {
  const auth = await requireContent();
  return !auth.error;
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const filter = mergeMongoFilters(buildDocumentSearchFilter(q, ['title', 'slug', 'excerpt', 'category', 'author', 'tags']));
  await connectToDatabase();
  const [items, total] = await Promise.all([
    BlogPost.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    BlogPost.countDocuments(filter)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const result = blogInputSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input', issues: result.error.issues }, { status: 400 });
  }
  const parsed = result.data;

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
    author: parsed.author || 'تیم محتوای فیدار فارمد',
    seoMetaTitle: parsed.seoMetaTitle || '',
    seoMetaDescription: parsed.seoMetaDescription || '',
    relatedProductIds: parsed.relatedProductIds || [],
    media: parsed.media || [],
    isPublished: parsed.isPublished ?? true,
    publishedAt: parsed.isPublished === false ? undefined : new Date()
  });
  return NextResponse.json({ item }, { status: 201 });
}
