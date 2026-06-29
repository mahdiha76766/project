import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { PaymentReceipt } from '@/models';
import {
  getCardToCardSettings,
  saveCardToCardSettings,
  normalizeCardToCardSettings,
  defaultCardToCardSettings
} from '@/lib/admin/card-to-card-settings';
import { purgeExpiredReceipts } from '@/lib/payment/receipt-service';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get('pageSize') || 20)));

  await connectToDatabase();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [items, total, settings] = await Promise.all([
    PaymentReceipt.find(filter)
      .populate('user', 'name mobile email')
      .populate('order', 'totalAmount orderStatus')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    PaymentReceipt.countDocuments(filter),
    getCardToCardSettings()
  ]);

  return NextResponse.json({ items, total, page, pageSize, settings });
}

export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const settings = normalizeCardToCardSettings(body.settings ?? body);
    const saved = await saveCardToCardSettings(settings);
    return NextResponse.json({ settings: saved });
  } catch {
    return NextResponse.json({ error: 'ذخیره تنظیمات ناموفق بود' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (body.action === 'purge') {
    const deleted = await purgeExpiredReceipts();
    return NextResponse.json({ deleted });
  }
  return NextResponse.json({ settings: defaultCardToCardSettings });
}
