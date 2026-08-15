import 'server-only';

import mongoose from 'mongoose';
import { Product } from '@/models';
import { PriceHistory, PriceSaveMeta } from '@/models/PriceHistory';
import { connectToDatabase } from '@/lib/db/mongoose';
import { syncAllPortalProductsToExcel } from '@/lib/admin/product-excel-full-sync';

function productIdFilters(id: string): Array<Record<string, unknown>> {
  const trimmed = String(id || '').trim();
  if (!trimmed) return [];
  const filters: Array<Record<string, unknown>> = [{ _id: trimmed }];
  if (mongoose.Types.ObjectId.isValid(trimmed) && String(new mongoose.Types.ObjectId(trimmed)) === trimmed) {
    filters.push({ _id: new mongoose.Types.ObjectId(trimmed) });
  }
  return filters;
}

type RawProduct = {
  _id: unknown;
  name?: string;
};

/**
 * حذف از Mongo، سپس بازنویسی کامل اکسل از وضعیت فعلی پورتال.
 */
export async function deletePortalProduct(productId: string) {
  const id = String(productId || '').trim();
  if (!id) throw new Error('شناسه محصول نامعتبر است');

  await connectToDatabase();

  let raw: RawProduct | null = null;
  for (const filter of productIdFilters(id)) {
    raw = (await Product.collection.findOne(filter)) as RawProduct | null;
    if (raw) break;
  }
  if (!raw) throw new Error('محصول یافت نشد.');

  const productName = String(raw.name || '').trim();
  const idStr = String(raw._id);

  await PriceHistory.deleteMany({ productId: idStr });
  await PriceSaveMeta.deleteMany({ productId: idStr });

  let deleted = false;
  for (const filter of productIdFilters(id)) {
    const result = await Product.collection.deleteOne(filter);
    if (result.deletedCount > 0) {
      deleted = true;
      break;
    }
  }
  if (!deleted) throw new Error('حذف از پایگاه‌داده انجام نشد.');

  const excel = await syncAllPortalProductsToExcel();
  if (!excel.ok) {
    console.warn('[price-portal] excel full-sync failed after delete', excel);
    throw new Error(
      excel.reason === 'excel_file_missing'
        ? 'فایل اکسل products.xlsx یافت نشد'
        : excel.reason === 'site_prices_missing'
          ? 'شیت site_prices یافت نشد'
          : excel.reason === 'prices_sheet_missing'
            ? 'شیت قیمت یافت نشد'
            : 'خطا در همگام‌سازی اکسل پس از حذف'
    );
  }

  return {
    ok: true as const,
    productId: idStr,
    productName,
    excel: {
      ok: true as const,
      products: excel.products,
      priceRowsWritten: excel.priceRowsWritten,
      siteRowsWritten: excel.siteRowsWritten
    }
  };
}
