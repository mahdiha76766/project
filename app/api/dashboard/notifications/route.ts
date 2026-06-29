import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { Notification } from '@/models';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const notifications = await Notification.find({ user: auth.user.userId }).sort({ createdAt: -1 }).limit(50).lean();
  const unreadCount = await Notification.countDocuments({ user: auth.user.userId, isRead: false });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const body = await req.json();
  if (body.markAllRead) {
    await Notification.updateMany({ user: auth.user.userId }, { $set: { isRead: true } });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await Notification.updateOne({ _id: body.id, user: auth.user.userId }, { $set: { isRead: true } });
  }
  return NextResponse.json({ ok: true });
}
