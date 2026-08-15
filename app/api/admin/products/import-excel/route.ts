import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/api/guards';
import { getUploadsRoot } from '@/lib/admin/upload-storage';
import {
  PRODUCTS_EXCEL_FILENAME,
  resolveProductsExcelPath,
  syncProductsFromExcel
} from '@/lib/admin/product-excel-import';

function productsExcelPath() {
  return path.join(getUploadsRoot(), PRODUCTS_EXCEL_FILENAME);
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const root = getUploadsRoot();
    await fs.mkdir(root, { recursive: true });
    const filePath = productsExcelPath();

    try {
      await fs.access(filePath);
      const stat = await fs.stat(filePath);
      console.info('[excel][status]', { filePath, size: stat.size, modifiedAt: stat.mtime.toISOString() });
      return NextResponse.json({
        ok: true,
        filePath,
        publicPath: `/uploads/${PRODUCTS_EXCEL_FILENAME}`,
        exists: true,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString()
      });
    } catch {
      console.info('[excel][status] missing', { filePath });
      return NextResponse.json({
        ok: true,
        filePath,
        publicPath: `/uploads/${PRODUCTS_EXCEL_FILENAME}`,
        exists: false
      });
    }
  } catch (error) {
    console.error('[excel][status] failed', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    });
    const message = error instanceof Error ? error.message : 'خطا در مسیر آپلود اکسل';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  let filePath = '';
  try {
    const root = getUploadsRoot();
    await fs.mkdir(root, { recursive: true });
    filePath = productsExcelPath();
    // Keep resolveProductsExcelPath() as single source of truth (same path).
    if (resolveProductsExcelPath() !== filePath) {
      throw new Error('مسیر اکسل با getUploadsRoot() هم‌خوان نیست');
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);

    await fs.access(filePath);
    const before = await fs.stat(filePath);
    console.info('[excel][import] start', {
      filePath,
      size: before.size,
      dryRun
    });

    const result = await syncProductsFromExcel({ filePath, dryRun });

    let afterSize = before.size;
    try {
      const after = await fs.stat(filePath);
      afterSize = after.size;
    } catch {
      // file may be unchanged
    }

    console.info('[excel][import] done', {
      filePath,
      size: afterSize,
      dryRun,
      updated: result.updated?.length ?? 0,
      imported: result.imported?.length ?? 0
    });

    return NextResponse.json({
      ok: true,
      dryRun,
      filePath,
      size: afterSize,
      message: dryRun
        ? 'پیش‌نمایش همگام‌سازی انجام شد — تغییری ذخیره نشد'
        : 'همگام‌سازی محصولات از اکسل با موفقیت انجام شد',
      result
    });
  } catch (error) {
    console.error('[excel][import] failed', {
      filePath,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    });
    const message = error instanceof Error ? error.message : 'خطا در import محصولات';
    const status =
      message.includes('UPLOADS_DIR') || message.includes('هم‌خوان نیست')
        ? 500
        : message.includes('یافت نشد') || message.includes('ENOENT')
          ? 404
          : 400;
    return NextResponse.json({ ok: false, error: message, filePath: filePath || undefined }, { status });
  }
}

/** Upload/replace products.xlsx under UPLOADS_DIR */
export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  let filePath = '';
  try {
    const root = getUploadsRoot();
    await fs.mkdir(root, { recursive: true });
    filePath = productsExcelPath();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'فایل اکسل ارسال نشده است' }, { status: 400 });
    }

    const name = String(file.name || '').toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      return NextResponse.json({ ok: false, error: 'فقط فایل اکسل (.xlsx) مجاز است' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    const stat = await fs.stat(filePath);

    console.info('[excel][upload] saved', {
      filePath,
      size: stat.size,
      originalName: file.name
    });

    return NextResponse.json({
      ok: true,
      filePath,
      publicPath: `/uploads/${PRODUCTS_EXCEL_FILENAME}`,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      message: 'فایل اکسل با موفقیت در مسیر آپلود ذخیره شد'
    });
  } catch (error) {
    console.error('[excel][upload] failed', {
      filePath,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    });
    const message = error instanceof Error ? error.message : 'خطا در ذخیره فایل اکسل';
    return NextResponse.json({ ok: false, error: message, filePath: filePath || undefined }, { status: 500 });
  }
}
