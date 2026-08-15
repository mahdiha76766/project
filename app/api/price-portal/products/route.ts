import { NextResponse } from 'next/server';
import { verifyPricePortalAccess } from '@/lib/price-portal/auth';
import { createPortalProduct } from '@/lib/price-portal/create-product';
import { listPricePortalProducts } from '@/lib/price-portal/products';
import {
  assertSameOrigin,
  checkPortalReadRate,
  checkPortalWriteRate,
  getClientIp,
  newPortalProductSchema
} from '@/lib/price-portal/security';
import { logInfo } from '@/lib/monitoring/logger';

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rate = checkPortalReadRate(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'تعداد درخواست زیاد است' }, { status: 429 });
  }

  const access = await verifyPricePortalAccess();
  if (!access.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await listPricePortalProducts();
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'درخواست نامعتبر' }, { status: 403 });
  }

  const access = await verifyPricePortalAccess();
  if (!access.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const rate = checkPortalWriteRate(ip);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'تعداد درخواست زیاد است. کمی صبر کنید.' }, { status: 429 });
  }

  try {
    const raw = await req.json();
    const parsed = newPortalProductSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'داده نامعتبر است' }, { status: 400 });
    }

    const result = await createPortalProduct(parsed.data);

    logInfo('price_portal.product_created', {
      ip: ip.replace(/\d+$/, '****'),
      productId: result.productId,
      name: result.name,
      variants: result.variantsCount,
      sourceRow: result.sourceRow,
      via: access.via
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در افزودن محصول';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
