import 'server-only';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  SALES_CACHE_TAG as TAG,
  defaultSalesConfig,
  normalizeSalesConfig,
  type SalesConfig
} from '@/lib/commerce/sales-types';

export {
  defaultSalesConfig,
  normalizeSalesConfig,
  shouldShowPrices,
  type SalesConfig
} from '@/lib/commerce/sales-types';

export const SALES_SETTINGS_KEY = 'site_sales';
export const SALES_CACHE_TAG = TAG;

async function readSalesConfig(): Promise<SalesConfig> {
  try {
    await connectToDatabase();
    const row = (await Setting.findOne({ key: SALES_SETTINGS_KEY }).lean()) as { value?: unknown } | null;
    return normalizeSalesConfig(row?.value);
  } catch {
    return defaultSalesConfig;
  }
}

export const getSalesConfig = unstable_cache(readSalesConfig, ['sales-config'], {
  tags: [SALES_CACHE_TAG],
  revalidate: 10
});

export async function saveSalesConfig(
  input: Pick<SalesConfig, 'salesEnabled' | 'showPricesWhenSalesDisabled'>,
  updatedBy?: string | null
) {
  await connectToDatabase();
  const next: SalesConfig = {
    salesEnabled: Boolean(input.salesEnabled),
    showPricesWhenSalesDisabled: Boolean(input.showPricesWhenSalesDisabled),
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || null
  };
  await Setting.findOneAndUpdate(
    { key: SALES_SETTINGS_KEY },
    { value: next },
    { upsert: true, new: true }
  );
  revalidateTag(SALES_CACHE_TAG);
  revalidatePath('/', 'layout');
  revalidatePath('/products');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  return next;
}

export async function assertSalesEnabled() {
  const config = await getSalesConfig();
  if (!config.salesEnabled) {
    return {
      error: NextResponse.json(
        {
          error: 'فروش آنلاین در حال حاضر غیرفعال است.',
          code: 'ONLINE_SALES_DISABLED'
        },
        { status: 403 }
      )
    };
  }
  return { config };
}
