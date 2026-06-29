import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Product, Review, User } from '@/models';
import { getSessionUser } from '@/lib/auth/session';
import { verifyCaptchaFromBody } from '@/lib/captcha/verify-request';

const createReviewSchema = z.object({ rating: z.number().min(1).max(5), title: z.string().trim().min(3).max(120), comment: z.string().trim().min(10).max(2000) });

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).select('_id');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const items = await Review.find({ productId: product._id, status: 'APPROVED', isDeleted: false }).sort({ createdAt: -1 }).lean();
  const averageRating = items.length ? Number((items.reduce((s, r: any) => s + (r.rating || 0), 0) / items.length).toFixed(1)) : 0;
  return NextResponse.json({ items, averageRating, total: items.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'برای ثبت نظر باید وارد حساب کاربری شوید.' }, { status: 401 });

  const raw = await req.json();
  const captcha = await verifyCaptchaFromBody(raw, 'reviews');
  if (!captcha.ok) return NextResponse.json({ error: captcha.error }, { status: 400 });
  const parsed = createReviewSchema.parse(raw);
  const { slug } = await params;
  await connectToDatabase();
  const product = await Product.findOne({ slug, isActive: true }).select('_id');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const user = await User.findById(session.userId).select('name');

  const existing = await Review.findOne({ productId: product._id, userId: session.userId, isDeleted: false });
  if (existing) {
    existing.rating = parsed.rating;
    existing.title = parsed.title;
    existing.comment = parsed.comment;
    existing.status = 'PENDING';
    existing.editedByAdmin = false;
    await existing.save();
    return NextResponse.json({ ok: true, updated: true, message: 'نظر قبلی شما ویرایش شد و دوباره در صف بررسی قرار گرفت.' });
  }

  await Review.create({ productId: product._id, userId: session.userId, userName: user?.name || '', rating: parsed.rating, title: parsed.title, comment: parsed.comment, status: 'PENDING', isDeleted: false });
  return NextResponse.json({ ok: true, message: 'نظر شما با موفقیت ثبت شد و پس از بررسی توسط مدیریت نمایش داده می‌شود.' }, { status: 201 });
}
