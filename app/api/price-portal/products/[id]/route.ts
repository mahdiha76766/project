import { NextResponse } from 'next/server';
import { verifyPricePortalAccess } from '@/lib/price-portal/auth';
import { deletePortalProduct } from '@/lib/price-portal/delete-product';
import {
  assertSameOrigin,
  checkPortalWriteRate,
  getClientIp
} from '@/lib/price-portal/security';
import { logInfo } from '@/lib/monitoring/logger';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const result = await deletePortalProduct(id);

    logInfo('price_portal.product_deleted', {
      ip: ip.replace(/\d+$/, '****'),
      productId: result.productId,
      name: result.productName,
      excel: result.excel,
      via: access.via
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در حذف محصول';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
