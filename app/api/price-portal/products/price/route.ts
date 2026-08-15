import { NextResponse } from 'next/server';
import { verifyPricePortalAccess } from '@/lib/price-portal/auth';
import { updatePricePortalPrice } from '@/lib/price-portal/products';
import {
  assertSameOrigin,
  auditPriceChange,
  checkPortalWriteRate,
  getClientIp,
  priceUpdateSchema
} from '@/lib/price-portal/security';

export async function PATCH(req: Request) {
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
    const parsed = priceUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'داده نامعتبر است' }, { status: 400 });
    }

    const {
      productId,
      variantId,
      variantSku,
      price,
      discountPrice,
      hasSitePrice,
      sitePercent,
      inStock,
      hasWholesale,
      wholesaleDirection,
      wholesaleMode,
      wholesalePercent,
      wholesaleAmount,
      wholesaleQty,
      applyProportional
    } = parsed.data;

    const result = await updatePricePortalPrice({
      productId,
      variantId: variantId ?? null,
      variantSku: variantSku ?? null,
      price,
      discountPrice: discountPrice ?? null,
      hasSitePrice,
      sitePercent: sitePercent ?? null,
      hasWholesale,
      wholesaleDirection: wholesaleDirection ?? 'less',
      wholesaleMode: wholesaleMode ?? 'percent',
      wholesalePercent: wholesalePercent ?? null,
      wholesaleAmount: wholesaleAmount ?? null,
      wholesaleQty: wholesaleQty ?? '',
      inStock,
      applyProportional
    });

    auditPriceChange({
      ip,
      productId,
      variantId,
      price: result.sitePrice,
      via: access.via
    });

    return NextResponse.json({
      ok: true,
      portalPrice: result.portalPrice,
      sitePrice: result.sitePrice,
      hasSitePrice: result.hasSitePrice,
      sitePercent: result.sitePercent,
      hasWholesale: result.hasWholesale,
      wholesaleDirection: result.wholesaleDirection,
      wholesaleMode: result.wholesaleMode,
      wholesalePercent: result.wholesalePercent,
      wholesaleAmount: result.wholesaleAmount,
      wholesaleQty: result.wholesaleQty,
      wholesalePrice: result.wholesalePrice,
      inStock: result.inStock,
      proportionalUpdates: result.proportionalUpdates || [],
      excel: result.excel
        ? {
            ok: Boolean(result.excel.ok),
            matched: Boolean((result.excel as { matched?: boolean }).matched),
            updated: Boolean((result.excel as { updated?: boolean }).updated),
            reason: (result.excel as { reason?: string }).reason || null
          }
        : null
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در به‌روزرسانی قیمت';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
