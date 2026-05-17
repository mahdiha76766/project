import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Setting } from '@/models';

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const setting = await Setting.findOne({ key: 'home_hero_slides' });
  return NextResponse.json({ slides: setting?.value || [] });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const body = await req.json();
  await Setting.findOneAndUpdate({ key: 'home_hero_slides' }, { value: body.slides }, { upsert: true, new: true });
  return NextResponse.json({ ok: true });
}
