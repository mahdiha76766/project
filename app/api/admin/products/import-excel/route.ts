import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { requireAdmin } from '@/lib/api/guards';
import {
  PRODUCTS_EXCEL_FILENAME,
  resolveProductsExcelPath,
  syncProductsFromExcel
} from '@/lib/admin/product-excel-import';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const filePath = resolveProductsExcelPath();
  try {
    await fs.access(filePath);
    const stat = await fs.stat(filePath);
    return NextResponse.json({
      ok: true,
      filePath,
      publicPath: `/uploads/${PRODUCTS_EXCEL_FILENAME}`,
      exists: true,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString()
    });
  } catch {
    return NextResponse.json({
      ok: true,
      filePath,
      publicPath: `/uploads/${PRODUCTS_EXCEL_FILENAME}`,
      exists: false
    });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const filePath = resolveProductsExcelPath(body?.filePath);

    await fs.access(filePath);

    const result = await syncProductsFromExcel({ filePath, dryRun });
    return NextResponse.json({
      ok: true,
      dryRun,
      message: dryRun
        ? 'پیش‌نمایش همگام‌سازی انجام شد — تغییری ذخیره نشد'
        : 'همگام‌سازی محصولات از اکسل با موفقیت انجام شد',
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در import محصولات';
    const status = message.includes('یافت نشد') || message.includes('ENOENT') ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
