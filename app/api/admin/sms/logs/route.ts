import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { SmsLog } from '@/models';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(10, Number(searchParams.get('pageSize') || 30)));
  const status = searchParams.get('status') || '';
  const eventKey = searchParams.get('eventKey') || '';
  const mobile = searchParams.get('mobile') || '';

  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (eventKey) filter.eventKey = eventKey;
  if (mobile) filter.mobile = { $regex: mobile.replace(/\D/g, ''), $options: 'i' };

  const [items, total] = await Promise.all([
    SmsLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    SmsLog.countDocuments(filter)
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
