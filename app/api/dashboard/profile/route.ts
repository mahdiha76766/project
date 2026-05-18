import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/mongoose';
import { User } from '@/models';

const schema = z.object({ firstName: z.string().min(2), lastName: z.string().min(2), mobile: z.string().min(8), email: z.string().email() });

export async function GET() {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectToDatabase(); const u:any = await User.findById(user.userId).select('name mobile email').lean();
  const parts = String(u?.name || '').split(' '); const firstName = parts[0] || ''; const lastName = parts.slice(1).join(' ');
  return NextResponse.json({ profile: { firstName, lastName, mobile: u?.mobile || '', email: u?.email || '' } });
}

export async function PUT(req: Request) {
  const user = await getSessionUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = schema.parse(await req.json()); await connectToDatabase();
  const item = await User.findByIdAndUpdate(user.userId, { name: `${parsed.firstName} ${parsed.lastName}`.trim(), mobile: parsed.mobile, email: parsed.email }, { new: true }).select('name mobile email');
  return NextResponse.json({ item });
}
