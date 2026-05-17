import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogComment, BlogPost, User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';

const commentSchema = z.object({ comment: z.string().trim().min(5).max(1000) });

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).select('_id');
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const items = await BlogComment.find({ postId: post._id, isApproved: true }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'برای ارسال دیدگاه باید وارد حساب کاربری شوید.' }, { status: 401 });
  const parsed = commentSchema.parse(await req.json());
  const { slug } = await params;
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, isPublished: true }).select('_id');
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const user = await User.findById(session.userId).select('name');
  await BlogComment.create({ postId: post._id, userId: session.userId, userName: user?.name || '', comment: parsed.comment, isApproved: false });
  return NextResponse.json({ ok: true, message: 'دیدگاه شما ثبت شد و پس از تایید نمایش داده می‌شود.' }, { status: 201 });
}
