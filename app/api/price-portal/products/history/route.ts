import { NextResponse } from 'next/server';
import { verifyPricePortalAccess } from '@/lib/price-portal/auth';
import { listPriceHistory } from '@/lib/price-portal/history';
import { checkPortalReadRate, getClientIp } from '@/lib/price-portal/security';

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rate = checkPortalReadRate(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });
  }

  const access = await verifyPricePortalAccess();
  if (!access.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = String(searchParams.get('productId') || '').trim();
  const variantId = String(searchParams.get('variantId') || '').trim() || null;

  if (!productId) {
    return NextResponse.json({ error: 'شناسه محصول لازم است' }, { status: 400 });
  }

  const items = await listPriceHistory({ productId, variantId });
  return NextResponse.json({ items });
}
