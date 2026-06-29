import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getActiveShippingMethods } from '@/lib/checkout/shipping';

export async function GET() {
  await connectToDatabase();
  const methods = await getActiveShippingMethods();
  return NextResponse.json({ methods });
}
