import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function POST(req: Request) {
  await connectToDatabase();
  const body = await req.json();
  const user = await User.create({ name: body.name, mobile: body.mobile, email: body.email, password: body.password, role: 'CUSTOMER' });
  return NextResponse.json({ id: user._id, mobile: user.mobile });
}
