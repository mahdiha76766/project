import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { validateAndComputeCoupon } from '@/lib/checkout/pricing';
import { assertSalesEnabled } from '@/lib/commerce/sales';

export async function POST(req: Request) {
  const sales = await assertSalesEnabled();
  if (sales.error) return sales.error;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'ابتدا وارد شوید' }, { status: 401 });
  await connectToDatabase();
  const body = await req.json();
  const result = await validateAndComputeCoupon({
    code: body.code,
    userId: user.userId,
    subtotal: body.subtotal,
    productIds: body.productIds || [],
    categoryIds: body.categoryIds || [],
    shippingCost: body.shippingCost || 0
  });
  return NextResponse.json({ discount: result.discount, freeShipping: result.freeShipping });
}
