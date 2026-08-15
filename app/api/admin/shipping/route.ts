import { NextResponse } from 'next/server';
import { ShippingMethod } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { DEFAULT_SHIPPING_ON_DELIVERY, SHIPPING_METHOD_CODES } from '@/constants/shipping';
import { getPaginationParams, paginatedResponse } from '@/lib/admin/pagination';
import { buildDocumentSearchFilter, getListSearchQuery, mergeMongoFilters } from '@/lib/admin/list-search';

async function guard() {
  const u = await getSessionUser();
  return u && hasMinimumRole(u.role, 'ADMIN');
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { page, limit, skip } = getPaginationParams(req.url);
  const q = getListSearchQuery(req.url);
  const filter = mergeMongoFilters(buildDocumentSearchFilter(q, ['name', 'code', 'description']));
  await connectToDatabase();
  const [items, total] = await Promise.all([
    ShippingMethod.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ShippingMethod.countDocuments(filter)
  ]);
  return NextResponse.json(paginatedResponse(items, total, page, limit));
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const b = await req.json();
    const code = String(b.code || '').trim().toUpperCase();
    if (!SHIPPING_METHOD_CODES.includes(code as any)) {
      return NextResponse.json({ error: 'کد روش ارسال معتبر نیست.' }, { status: 400 });
    }
    if (!b.name?.trim()) return NextResponse.json({ error: 'نام روش ارسال الزامی است.' }, { status: 400 });
    await connectToDatabase();
    const item = await ShippingMethod.create({
      code,
      name: b.name.trim(),
      baseCost: Number(b.baseCost || 0),
      costPerKg: Number(b.costPerKg || 0),
      estimatedDays: Number(b.estimatedDays || 1),
      cityOnly: Boolean(b.cityOnly),
      freeAboveAmount: b.freeAboveAmount ? Number(b.freeAboveAmount) : 0,
      allowShippingOnDelivery:
        b.allowShippingOnDelivery ?? DEFAULT_SHIPPING_ON_DELIVERY[code as keyof typeof DEFAULT_SHIPPING_ON_DELIVERY] ?? true,
      isActive: b.isActive ?? true
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'خطا در ایجاد روش ارسال' }, { status: 400 });
  }
}
