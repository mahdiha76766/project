import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireUser } from '@/lib/api/guards';
import { getWalletBalance } from '@/lib/finance/wallet-service';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  await connectToDatabase();
  const wallet = await getWalletBalance(auth.user.userId);
  return NextResponse.json({ wallet });
}
