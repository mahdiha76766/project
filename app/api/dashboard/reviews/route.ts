import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { BlogComment, Review } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase();

  const productReviews = await Review.find({ userId: user.userId, isDeleted: false })
    .populate('productId', 'name slug')
    .sort({ createdAt: -1 })
    .lean();

  const blogComments = await BlogComment.find({ userId: user.userId, isDeleted: false })
    .populate('postId', 'title slug')
    .sort({ createdAt: -1 })
    .lean();

  const items = [
    ...productReviews.map((r: any) => ({
      _id: String(r._id),
      type: 'product',
      targetName: r.productId?.name || '-',
      targetSlug: r.productId?.slug || '',
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt
    })),
    ...blogComments.map((c: any) => ({
      _id: String(c._id),
      type: 'blog',
      targetName: c.postId?.title || '-',
      targetSlug: c.postId?.slug || '',
      rating: null,
      title: 'دیدگاه مقاله',
      comment: c.comment,
      status: c.status,
      createdAt: c.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, type, title, comment, rating } = await req.json();
  await connectToDatabase();

  if (type === 'product') {
    const item: any = await Review.findOne({ _id: id, userId: user.userId, status: 'PENDING', isDeleted: false });
    if (!item) return NextResponse.json({ error: 'این نظر قابل ویرایش نیست.' }, { status: 400 });
    item.title = title;
    item.comment = comment;
    item.rating = rating;
    await item.save();
    return NextResponse.json({ ok: true });
  }

  const blogItem: any = await BlogComment.findOne({ _id: id, userId: user.userId, status: 'PENDING', isDeleted: false });
  if (!blogItem) return NextResponse.json({ error: 'این دیدگاه قابل ویرایش نیست.' }, { status: 400 });
  blogItem.comment = comment;
  await blogItem.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, type } = await req.json();
  await connectToDatabase();

  if (type === 'product') {
    await Review.findOneAndUpdate({ _id: id, userId: user.userId, status: 'PENDING' }, { isDeleted: true });
    return NextResponse.json({ ok: true });
  }

  await BlogComment.findOneAndUpdate({ _id: id, userId: user.userId, status: 'PENDING' }, { isDeleted: true });
  return NextResponse.json({ ok: true });
}
