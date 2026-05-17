import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Product, Review } from '@/models';
import { getSessionUser } from '@/lib/auth/session';

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  comment: z.string().trim().min(10).max(2000)
});

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).select('_id');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const items = await Review.find({ product: product._id, isApproved: true })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'برای ثبت نظر باید وارد حساب کاربری شوید.' }, { status: 401 });

  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).select('_id');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const parsed = createReviewSchema.parse(await req.json());

  const existing = await Review.findOne({ product: product._id, user: session.userId });
  if (existing) {
    existing.rating = parsed.rating;
    existing.title = parsed.title;
    existing.comment = parsed.comment;
    existing.isApproved = false;
    await existing.save();
    return NextResponse.json({ ok: true, updated: true, message: 'نظر قبلی شما ویرایش شد و دوباره در صف بررسی قرار گرفت.' });
  }

  await Review.create({
    user: session.userId,
    product: product._id,
    rating: parsed.rating,
    title: parsed.title,
    comment: parsed.comment,
    isApproved: false
  });

  return NextResponse.json({ ok: true, message: 'نظر شما با موفقیت ثبت شد و پس از بررسی توسط مدیریت نمایش داده می‌شود.' }, { status: 201 });
}
