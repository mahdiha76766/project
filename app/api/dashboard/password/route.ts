import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { User } from '@/models';

const schema = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8), confirmPassword: z.string().min(8) });

export async function POST(req: Request) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.parse(await req.json());
  if (parsed.newPassword !== parsed.confirmPassword) return NextResponse.json({ error: 'تکرار رمز جدید مطابقت ندارد.' }, { status: 400 });
  await connectToDatabase();
  const u:any = await User.findById(user.userId).select('+password');
  const ok = await bcrypt.compare(parsed.currentPassword, u.password);
  if (!ok) return NextResponse.json({ error: 'رمز فعلی اشتباه است.' }, { status: 400 });
  u.password = parsed.newPassword; await u.save();
  return NextResponse.json({ ok: true, message: 'رمز عبور با موفقیت تغییر کرد.' });
}
