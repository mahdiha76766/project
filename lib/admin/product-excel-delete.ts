import 'server-only';

import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import {
  PRODUCTS_EXCEL_SHEET,
  normalizeProductText,
  resolveProductsExcelPath
} from '@/lib/admin/product-excel-import';
import { LEGACY_PRICES_SHEET } from '@/lib/admin/product-excel-append';
import {
  readProductsExcelWorkbook,
  withProductsExcelLock,
  writeProductsExcelWorkbook
} from '@/lib/admin/product-excel-io';

export type DeleteProductExcelInput = {
  productName: string;
  productSlug?: string;
  excelSlug?: string;
  sourceRow?: number | null;
  variantSkus?: string[];
};

function cellPlainValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('result' in value && value.result != null) return value.result;
    if ('text' in value && value.text != null) return value.text;
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((p) => p.text).join('');
    }
  }
  return value;
}

function buildColMap(row: ExcelJS.Row) {
  const colMap: Record<string, number> = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const label = String(cellPlainValue(cell.value) ?? '').trim();
    if (label) colMap[label] = colNumber;
  });
  return colMap;
}

function parseSitePricesLayout(sheet: ExcelJS.Worksheet) {
  const maxScan = Math.min(6, sheet.rowCount || 6);
  for (let r = 1; r <= maxScan; r++) {
    const colMap = buildColMap(sheet.getRow(r));
    if (colMap.price_toman != null || colMap['نام محصول'] != null) {
      return { headerRow: r, colMap };
    }
  }
  return null;
}

function normalizeSlug(value: string) {
  return normalizeProductText(value).replace(/-/g, '_');
}

function slugBelongsToProduct(rowSlug: string, productSlug: string, excelSlug: string) {
  const row = normalizeSlug(rowSlug);
  if (!row) return false;
  const bases = [productSlug, excelSlug]
    .map((s) => normalizeSlug(String(s || '')))
    .filter(Boolean);
  for (const base of bases) {
    if (row === base) return true;
    if (row.startsWith(`${base}_`)) return true;
  }
  return false;
}

function clearExcelRow(row: ExcelJS.Row, maxCol: number) {
  for (let c = 1; c <= maxCol; c++) {
    row.getCell(c).value = null;
  }
  row.commit();
}

/**
 * حذف کامل محصول از site_prices و شیت «قیمت»، سپس سورت مجدد برای remap کلیدها.
 */
export async function deleteProductFromExcel(
  input: DeleteProductExcelInput,
  filePath = resolveProductsExcelPath()
) {
  return withProductsExcelLock(() => deleteProductFromExcelUnlocked(input, filePath));
}

async function deleteProductFromExcelUnlocked(
  input: DeleteProductExcelInput,
  filePath: string
) {
  const productName = String(input.productName || '').trim();
  const productSlug = String(input.productSlug || '').trim();
  const excelSlug = String(input.excelSlug || productSlug).trim();
  const sourceRowHint = Number(input.sourceRow || 0) || 0;
  const skus = new Set(
    (input.variantSkus || [])
      .map((s) => normalizeProductText(String(s || '').trim()))
      .filter(Boolean)
  );

  if (!productName && !productSlug && !skus.size && !sourceRowHint) {
    return { ok: false as const, reason: 'identity_required' as const };
  }

  try {
    await fs.access(filePath);
  } catch {
    return { ok: false as const, reason: 'excel_file_missing' as const, filePath };
  }

  let workbook: ExcelJS.Workbook;
  try {
    workbook = await readProductsExcelWorkbook(filePath);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'excel_corrupted' || code === 'excel_file_missing') {
      return { ok: false as const, reason: code, filePath };
    }
    throw error;
  }

  const siteSheet = workbook.getWorksheet(PRODUCTS_EXCEL_SHEET);
  if (!siteSheet) {
    return { ok: false as const, reason: 'site_prices_missing' as const };
  }

  const priceSheet =
    workbook.getWorksheet(LEGACY_PRICES_SHEET) ||
    workbook.getWorksheet('قیمت ها') ||
    workbook.getWorksheet('قیمت‌ها');
  if (!priceSheet) {
    return { ok: false as const, reason: 'prices_sheet_missing' as const };
  }

  const layout = parseSitePricesLayout(siteSheet);
  if (!layout) {
    return { ok: false as const, reason: 'site_prices_layout_invalid' as const };
  }

  const nameCol = layout.colMap['نام محصول'];
  const slugCol = layout.colMap.slug;
  const idCol = layout.colMap.product_id ?? layout.colMap.site_key;
  const sourceCol = layout.colMap.source_row;
  const maxSiteCol = Math.max(20, ...Object.values(layout.colMap));

  const matchedSiteRows: number[] = [];
  const priceRowsToClear = new Set<number>();

  siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
    if (rowNumber <= layout.headerRow) return;

    const name = nameCol
      ? String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim()
      : '';
    const slug = slugCol
      ? String(cellPlainValue(excelRow.getCell(slugCol).value) ?? '').trim()
      : '';
    const productId = idCol
      ? String(cellPlainValue(excelRow.getCell(idCol).value) ?? '').trim()
      : '';
    const sourceRow = sourceCol
      ? Number(cellPlainValue(excelRow.getCell(sourceCol).value)) || 0
      : 0;

    const bySku = Boolean(productId && skus.has(normalizeProductText(productId)));
    const byName =
      Boolean(productName) &&
      normalizeProductText(name) === normalizeProductText(productName);
    const bySlug = slugBelongsToProduct(slug, productSlug, excelSlug);
    const bySource = Boolean(sourceRowHint && sourceRow === sourceRowHint && (byName || bySlug || bySku));

    if (!(bySku || byName || bySlug || bySource)) return;

    matchedSiteRows.push(rowNumber);
    if (sourceRow > 1) priceRowsToClear.add(sourceRow);
  });

  // اگر فقط source_row از Mongo داریم و در اکسل مچ نشد، همان ردیف قیمت را پاک کن
  if (!matchedSiteRows.length && sourceRowHint > 1) {
    priceRowsToClear.add(sourceRowHint);
  }

  // پاک‌سازی شیت قیمت
  let priceMaxCol = 7;
  priceSheet.getRow(1).eachCell({ includeEmpty: false }, (_c, col) => {
    if (col > priceMaxCol) priceMaxCol = col;
  });
  for (const rowNum of priceRowsToClear) {
    const row = priceSheet.getRow(rowNum);
    const rowName = String(cellPlainValue(row.getCell(1).value) ?? '').trim();
    // فقط اگر نام با محصول هم‌خوان است یا ردیف از site_prices آمده
    if (
      !rowName ||
      !productName ||
      normalizeProductText(rowName) === normalizeProductText(productName) ||
      matchedSiteRows.length
    ) {
      clearExcelRow(row, priceMaxCol);
    }
  }

  // حذف ردیف‌های site_prices از پایین به بالا
  matchedSiteRows.sort((a, b) => b - a);
  for (const rowNum of matchedSiteRows) {
    siteSheet.spliceRows(rowNum, 1);
  }

  // سورت خودکار عمداً حذف شد تا source_row جابه‌جا نشود و قیمت‌ها خالی/قاطی نشوند
  await writeProductsExcelWorkbook(workbook, filePath);

  console.info('[excel][delete-product] saved', {
    filePath,
    productName,
    removedSiteRows: matchedSiteRows.length,
    clearedPriceRows: priceRowsToClear.size
  });

  return {
    ok: true as const,
    removedSiteRows: matchedSiteRows.length,
    clearedPriceRows: priceRowsToClear.size,
    filePath
  };
}
