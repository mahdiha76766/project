import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCapability } from '@/lib/api/guards';
import { getSalesConfig, saveSalesConfig } from '@/lib/commerce/sales';

const schema = z.object({
  salesEnabled: z.boolean(),
  showPricesWhenSalesDisabled: z.boolean().optional()
});

export async function GET() {
  const auth = await requireCapability('commerce');
  if (auth.error) return auth.error;
  const config = await getSalesConfig();
  return NextResponse.json({ config });
}

export async function PUT(req: Request) {
  const auth = await requireCapability('commerce');
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const current = await getSalesConfig();
  const config = await saveSalesConfig(
    {
      salesEnabled: parsed.data.salesEnabled,
      showPricesWhenSalesDisabled: parsed.data.showPricesWhenSalesDisabled ?? current.showPricesWhenSalesDisabled
    },
    auth.user.userId
  );
  return NextResponse.json({ config, message: config.salesEnabled ? 'فروش آنلاین فعال شد.' : 'فروش آنلاین غیرفعال شد.' });
}
