import 'server-only';

import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import {
  PRODUCTS_EXCEL_SHEET,
  normalizeProductText,
  parseExcelPrice,
  resolveProductsExcelPath
} from '@/lib/admin/product-excel-import';
import { formatJalaliNowParts } from '@/lib/admin/jalali';
import {
  type StockStatusLabel
} from '@/lib/shop/stock-status';
import {
  ensureWholesaleHeaders,
  priceLookupFormula,
  priceSheetVariantCols,
  writeWholesaleToPriceRow,
  stripPriceSheetExtraColumns,
  clearPriceRowRetailSlots,
  WHOLESALE_PRICE_COL,
  WHOLESALE_QTY_COL,
  PRICE_SHEET_MAX_RETAIL_VARIANTS,
  PRICE_SHEET_LAST_COL
} from '@/lib/admin/product-excel-price-layout';
import {
  readProductsExcelWorkbook,
  withProductsExcelLock,
  writeProductsExcelWorkbook
} from '@/lib/admin/product-excel-io';

export const CHANGES_SHEET = 'تغییرات';

const CHANGE_LOG_HEADERS = [
  'تاریخ (شمسی)',
  'ساعت',
  'نام محصول',
  'slug',
  'نوع/وزن',
  'product_id',
  'نوع تغییر',
  'قیمت قبلی (تومان)',
  'قیمت جدید (تومان)',
  'قیمت عمده قبلی (تومان)',
  'قیمت عمده جدید (تومان)',
  'مقدار عمده'
] as const;

export type VariantRef = {
  productName: string;
  productSlug: string;
  variantName: string;
  variantSku?: string;
  excelSlug?: string;
  /** Base/portal price → price_toman */
  priceToman: number;
  /** Site markup percent 1–100 (excel column precent/percent) */
  sitePercent?: number | null;
  /** Computed site price → price_site */
  priceSite?: number | null;
  /** Excel has_site_price: بله | خیر */
  hasSitePrice?: boolean;
  /** قیمت عمده روی شیت «قیمت» ستون F/G — فقط وقتی touchWholesale=true نوشته می‌شود */
  hasWholesale?: boolean;
  /** اگر false/undefined باشد ستون F/G دست نخورده می‌ماند */
  touchWholesale?: boolean;
  wholesaleDirection?: 'less' | 'more' | null;
  wholesalePercent?: number | null;
  wholesaleQty?: string | null;
  wholesalePrice?: number | null;
  /** Excel دسته‌بندی */
  categoryName?: string | null;
  /** Excel وضعیت: فعال | غیرفعال */
  status?: 'فعال' | 'غیرفعال' | null;
  /** Excel stock_status: موجود | ناموجود */
  stockStatus?: StockStatusLabel | null;
  /** For matching after rename/slug change */
  previousProductName?: string | null;
  previousVariantName?: string | null;
  previousSlug?: string | null;
  /** اگر مشخص باشد، ردیف site_prices با همین source_row اولویت دارد */
  sourceRow?: number | null;
};

function normalizeSlug(value: string) {
  return normalizeProductText(value).replace(/-/g, '_');
}

function normalizeVariantLabel(value: string) {
  return normalizeProductText(value)
    .replace(/میلی\s*لیتر/g, 'میل')
    .replace(/میلی لیتر/g, 'میل')
    .replace(/میلیلیتر/g, 'میل')
    .replace(/mililit(?:er|re)?/gi, 'میل')
    .replace(/\bml\b/gi, 'میل')
    .replace(/گرمی/g, 'گرم')
    .replace(/\bg\b/gi, 'گرم')
    .replace(/کیلوگرم/g, 'کیلو')
    .replace(/\bkg\b/gi, 'کیلو')
    .replace(/نیم\s*لیتر/g, 'نیم لیتر')
    .replace(/half[_\s-]?liter/gi, 'نیم لیتر')
    .replace(/1[_\s-]?liter/gi, '1 لیتر')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGenericVariantLabel(value: string) {
  const raw = String(value || '').trim();
  const n = normalizeVariantLabel(raw).replace(/\s+/g, '');
  if (
    !n ||
    n === 'پیشفرض' ||
    n === 'default' ||
    n === 'عادی' ||
    n === 'اصلی' ||
    n === '-' ||
    n === '—'
  ) {
    return true;
  }
  // وزن‌های بی‌معنی از فرم ادمین مثل "1" / "2" نباید مانع مچ با «کیلو» شوند
  if (/^\d{1,4}$/.test(raw)) return true;
  return false;
}

function extractSizeToken(value: string): string {
  const normalized = normalizeVariantLabel(value);
  const match = normalized.match(/(\d+(?:[./]\d+)?)\s*(میل|گرم|کیلو|لیتر)|نیم لیتر/);
  return match ? match[0] : normalized;
}

function variantMatches(cellWeight: string, variantName: string): boolean {
  // پیش‌فرض / خالی با هر وزن واقعی مچ می‌شود تا sync گیر نکند
  if (isGenericVariantLabel(variantName) || isGenericVariantLabel(cellWeight)) return true;

  const a = normalizeVariantLabel(cellWeight);
  const b = normalizeVariantLabel(variantName);
  if (!a && b) return true;
  if (!a && !b) return true;
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;

  const sizeA = extractSizeToken(cellWeight);
  const sizeB = extractSizeToken(variantName);
  if (sizeA && sizeB && sizeA === sizeB) return true;
  return false;
}

function slugMatches(rowSlugRaw: string, ref: VariantRef): boolean {
  const rowSlug = normalizeSlug(rowSlugRaw);
  if (!rowSlug) return false;

  const candidates = [ref.excelSlug, ref.productSlug]
    .map((s) => normalizeSlug(String(s || '')))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (rowSlug === candidate) return true;
    // excel often encodes size in slug: oil_argan_grade_1_30ml
    if (rowSlug.startsWith(`${candidate}_`) || rowSlug.includes(`_${candidate}_`) || rowSlug.endsWith(`_${candidate}`)) {
      return true;
    }
    if (candidate.length >= 4 && (rowSlug.includes(candidate) || candidate.includes(rowSlug))) {
      return true;
    }
  }
  return false;
}

function nameMatchesExact(rowName: string, productName: string): boolean {
  const a = normalizeProductText(rowName);
  const b = normalizeProductText(productName);
  return Boolean(a && b && a === b);
}

function extractGradeToken(value: string): string {
  const text = normalizeProductText(value);
  if (/درجه\s*1|grade[_\s-]*1/.test(text) || /درجه\s*۱/.test(text)) return 'g1';
  if (/درجه\s*2|grade[_\s-]*2/.test(text) || /درجه\s*۲/.test(text)) return 'g2';
  return '';
}

function gradeCompatible(row: Record<string, unknown>, ref: VariantRef): boolean {
  const refGrade = extractGradeToken(`${ref.variantName} ${ref.productName} ${ref.excelSlug || ''} ${ref.productSlug || ''}`);
  if (!refGrade) return true;
  const rowGrade = extractGradeToken(
    `${row['نام محصول'] || ''} ${row.slug || ''} ${row.product_id || ''}`
  );
  if (!rowGrade) return true;
  return refGrade === rowGrade;
}

function rowMatchesSitePrices(row: Record<string, unknown>, ref: VariantRef): boolean {
  if (!gradeCompatible(row, ref)) return false;

  const variantCol = String(row['نوع/وزن'] || row['واحد'] || '').trim();
  const variantCandidates = [ref.variantName, ref.previousVariantName]
    .map((v) => String(v || '').trim())
    .filter(Boolean);

  const sku = String(row.product_id || row.site_key || '').trim();
  if (ref.variantSku && sku && normalizeProductText(sku) === normalizeProductText(ref.variantSku)) {
    return true;
  }

  const rowSlug = String(row.slug || '');
  const slugRef: VariantRef = {
    ...ref,
    excelSlug: ref.previousSlug || ref.excelSlug,
    productSlug: ref.previousSlug || ref.productSlug
  };

  const variantOk =
    !variantCandidates.length ||
    variantCandidates.every((c) => isGenericVariantLabel(c)) ||
    variantCandidates.some((candidate) => variantMatches(variantCol, candidate));

  if (slugMatches(rowSlug, slugRef) && variantOk) {
    return true;
  }

  if (slugMatches(rowSlug, slugRef)) {
    for (const candidate of variantCandidates.length ? variantCandidates : [ref.variantName]) {
      if (isGenericVariantLabel(String(candidate || ''))) return true;
      const sizeToken = extractSizeToken(candidate).replace(/\s+/g, '');
      const normalizedRowSlug = normalizeSlug(rowSlug).replace(/_/g, '');
      if (sizeToken && normalizedRowSlug.includes(sizeToken.replace(/\s+/g, ''))) {
        return true;
      }
    }
  }

  const name = String(row['نام محصول'] || '').trim();
  const nameCandidates = [ref.productName, ref.previousProductName]
    .map((v) => String(v || '').trim())
    .filter(Boolean);
  // مچ نام فقط دقیق — substring باعث جابه‌جایی قیمت بین محصولات مشابه می‌شد
  if (!nameCandidates.some((candidate) => nameMatchesExact(name, candidate))) return false;

  // اگر نام محصول مچ شد و واریانت جینک/عددی است، همان ردیف را بپذیر
  // (مثل نشاسته گندم گل با containerSize="1" در برابر وزن «کیلو» در اکسل)
  return variantOk;
}

function setCellIfCol(
  excelRow: ExcelJS.Row,
  colMap: Record<string, number>,
  labels: string[],
  value: ExcelJS.CellValue
) {
  for (const label of labels) {
    const col = colMap[label];
    if (col == null) continue;
    excelRow.getCell(col).value = value;
    return true;
  }
  return false;
}

/** Ensure header `stock_status` exists; prefer first free/junk column after core fields. */
export function ensureStockStatusColumn(
  sheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  if (layout.colMap.stock_status != null) return layout.colMap.stock_status;

  const preferred =
    Math.max(
      layout.colMap.price_lookup_key || 0,
      layout.colMap['وضعیت'] || 0,
      layout.colMap.site_key || 0,
      15
    ) + 1;

  const header = sheet.getRow(layout.headerRow);
  let col = preferred;
  for (let i = 0; i < 20; i++) {
    const existing = String(cellPlainValue(header.getCell(col).value) ?? '').trim();
    if (!existing || existing === 'stock_status' || existing.startsWith('جستجوی')) {
      header.getCell(col).value = 'stock_status';
      layout.colMap.stock_status = col;
      return col;
    }
    col += 1;
  }

  header.getCell(preferred).value = 'stock_status';
  layout.colMap.stock_status = preferred;
  return preferred;
}

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

function cellNumber(value: ExcelJS.CellValue): number {
  const raw = cellPlainValue(value);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

type SheetLayout = {
  headerRow: number;
  colMap: Record<string, number>;
};

function buildColMap(row: ExcelJS.Row) {
  const colMap: Record<string, number> = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const label = String(cellPlainValue(cell.value) ?? '').trim();
    if (label) colMap[label] = colNumber;
  });
  return colMap;
}

function parseSitePricesLayout(sheet: ExcelJS.Worksheet): SheetLayout | null {
  const maxScan = Math.min(6, sheet.rowCount || 6);
  for (let r = 1; r <= maxScan; r++) {
    const colMap = buildColMap(sheet.getRow(r));
    if (colMap.price_toman != null) {
      return { headerRow: r, colMap };
    }
  }
  return null;
}

function readDataRow(sheet: ExcelJS.Worksheet, rowIndex: number, colMap: Record<string, number>) {
  const row: Record<string, unknown> = {};
  const excelRow = sheet.getRow(rowIndex);
  for (const [label, col] of Object.entries(colMap)) {
    row[label] = cellPlainValue(excelRow.getCell(col).value);
  }
  return row;
}

function hasValidChangesHeader(sheet: ExcelJS.Worksheet) {
  const first = String(cellPlainValue(sheet.getRow(1).getCell(1).value) ?? '').trim();
  return first === CHANGE_LOG_HEADERS[0];
}

function ensureChangesSheet(workbook: ExcelJS.Workbook) {
  let sheet = workbook.getWorksheet(CHANGES_SHEET);
  if (sheet && !hasValidChangesHeader(sheet)) {
    workbook.removeWorksheet(sheet.id);
    sheet = undefined;
  }
  if (!sheet) {
    sheet = workbook.addWorksheet(CHANGES_SHEET, {
      views: [{ rightToLeft: true }]
    });
    sheet.addRow([...CHANGE_LOG_HEADERS]);
    return sheet;
  }

  const header = sheet.getRow(1);
  const col7 = String(cellPlainValue(header.getCell(7).value) ?? '').trim();

  // فرمت قدیمی: ستون ۷ = قیمت قبلی → یک‌بار شیفت به فرمت جدید
  if (col7 === 'قیمت قبلی (تومان)') {
    const last = Math.max(sheet.rowCount || 1, sheet.actualRowCount || 1);
    for (let r = last; r >= 2; r--) {
      const row = sheet.getRow(r);
      const prevPrice = cellPlainValue(row.getCell(7).value);
      const nextPrice = cellPlainValue(row.getCell(8).value);
      if (prevPrice === '' && nextPrice === '') continue;
      row.getCell(12).value = null;
      row.getCell(11).value = null;
      row.getCell(10).value = null;
      row.getCell(9).value = (nextPrice as ExcelJS.CellValue) ?? null;
      row.getCell(8).value = (prevPrice as ExcelJS.CellValue) ?? null;
      row.getCell(7).value = 'قیمت پایه';
    }
  }

  for (let i = 0; i < CHANGE_LOG_HEADERS.length; i++) {
    header.getCell(i + 1).value = CHANGE_LOG_HEADERS[i];
  }

  return sheet;
}

function appendChangeLog(
  workbook: ExcelJS.Workbook,
  ref: VariantRef,
  opts: {
    previousPrice: number;
    newPrice: number;
    previousWholesale: number | null;
    newWholesale: number | null;
    wholesaleQty: string;
    baseChanged: boolean;
    wholesaleChanged: boolean;
  }
) {
  if (!opts.baseChanged && !opts.wholesaleChanged) return;

  const sheet = ensureChangesSheet(workbook);
  const { date, time } = formatJalaliNowParts();
  const changeType =
    opts.baseChanged && opts.wholesaleChanged
      ? 'قیمت پایه + عمده'
      : opts.wholesaleChanged
        ? 'قیمت عمده'
        : 'قیمت پایه';

  sheet.addRow([
    date,
    time,
    ref.productName,
    ref.productSlug || ref.excelSlug || '',
    ref.variantName,
    ref.variantSku || '',
    changeType,
    opts.baseChanged ? opts.previousPrice : '',
    opts.baseChanged ? opts.newPrice : '',
    opts.wholesaleChanged ? (opts.previousWholesale ?? '') : '',
    opts.wholesaleChanged ? (opts.newWholesale ?? '') : '',
    opts.wholesaleChanged ? opts.wholesaleQty || '' : ''
  ]);
}

function readWholesalePriceToman(priceRow: ExcelJS.Row): number | null {
  const raw = cellPlainValue(priceRow.getCell(WHOLESALE_PRICE_COL).value);
  if (raw === '' || raw == null) return null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 1000);
}

function readWholesaleQty(priceRow: ExcelJS.Row): string {
  return String(cellPlainValue(priceRow.getCell(WHOLESALE_QTY_COL).value) ?? '').trim();
}

/**
 * Updates site_prices row (+ optional site markup columns + name/slug/weight/category/status)
 * and mirrors name/weight on sheet «قیمت».
 * Appends a row to sheet «تغییرات» when price_toman changes.
 */
export async function syncPriceToProductsExcel(ref: VariantRef, filePath = resolveProductsExcelPath()) {
  return withProductsExcelLock(async () => {
    try {
      await fs.access(filePath);
    } catch {
      return { ok: false, reason: 'excel_file_missing' as const };
    }

    let workbook: ExcelJS.Workbook;
    try {
      workbook = await readProductsExcelWorkbook(filePath);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'excel_corrupted' || code === 'excel_file_missing') {
        return { ok: false, reason: code };
      }
      throw error;
    }

    const siteSheet = workbook.getWorksheet(PRODUCTS_EXCEL_SHEET);
    if (!siteSheet) {
      return { ok: false, reason: 'sheet_missing' as const };
    }

    const layout = parseSitePricesLayout(siteSheet);
    if (!layout) {
      return { ok: false, reason: 'price_toman_column_missing' as const };
    }

    const priceCol = layout.colMap.price_toman;
    const percentCol =
      layout.colMap.precent ?? layout.colMap.percent ?? layout.colMap['درصد'] ?? null;
    const priceSiteCol = layout.colMap.price_site ?? layout.colMap['قیمت سایت'] ?? null;
    const hasSiteCol =
      layout.colMap.has_site_price ?? layout.colMap['قیمت سایت جداگانه'] ?? null;

    let matchedRow = 0;
    let previousPrice = 0;
    let wroteAny = false;
    let sourceRowNum = 0;
    let lookupKey = '';
    let matchedExcelWeight = '';
    let matchedProductId = '';

    const nextHasSite = Boolean(ref.hasSitePrice);
    const nextPercent = nextHasSite ? Number(ref.sitePercent || 0) : 0;
    const nextPriceSite = nextHasSite ? Number(ref.priceSite || 0) : 0;
    const hasSiteLabel = nextHasSite ? 'بله' : 'خیر';
    const nextStatus = ref.status || null;
    const nextCategory = ref.categoryName != null ? String(ref.categoryName) : null;
    const excelSlugValue = String(ref.excelSlug || ref.productSlug || '').trim();
    const nextStockStatus: StockStatusLabel | null = ref.stockStatus ?? null;

    const stockStatusCol = ensureStockStatusColumn(siteSheet, layout);

    siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
      if (matchedRow || rowNumber <= layout.headerRow) return;

      const row = readDataRow(siteSheet, rowNumber, layout.colMap);
      const productId = String(row.product_id || row.site_key || '').trim();
      const productName = String(row['نام محصول'] || '').trim();
      if (!productId && !productName) return;

      // ۱) اولویت اول: SKU دقیق (پایدارترین کلید)
      const bySku =
        Boolean(ref.variantSku) &&
        Boolean(productId) &&
        normalizeProductText(productId) === normalizeProductText(String(ref.variantSku));

      const rowSource = Number(row.source_row || 0) || 0;
      const bySourceRow =
        !bySku &&
        ref.sourceRow != null &&
        Number(ref.sourceRow) > 0 &&
        rowSource === Number(ref.sourceRow);

      if (bySku) {
        // exact SKU — قبول
      } else if (bySourceRow) {
        // source_row مشترک بین دو محصول را اشتباه مچ نکن
        const sameProduct =
          normalizeProductText(productName) === normalizeProductText(ref.productName) ||
          Boolean(
            ref.variantSku &&
              productId &&
              normalizeProductText(productId) === normalizeProductText(ref.variantSku)
          ) ||
          slugMatches(String(row.slug || ''), ref);
        if (!sameProduct) return;

        const variantCol = String(row['نوع/وزن'] || row['واحد'] || '').trim();
        const variantCandidates = [ref.variantName, ref.previousVariantName]
          .map((v) => String(v || '').trim())
          .filter(Boolean);
        const variantOk =
          !variantCandidates.length ||
          variantCandidates.every((c) => isGenericVariantLabel(c)) ||
          !variantCol ||
          variantCandidates.some((candidate) => variantMatches(variantCol, candidate));
        if (!variantOk) return;
      } else if (!rowMatchesSitePrices(row, ref)) {
        return;
      }

      const priceCell = excelRow.getCell(priceCol);
      previousPrice = cellNumber(priceCell.value);
      sourceRowNum = Number(row.source_row || 0) || 0;
      lookupKey = String(row.price_lookup_key || '').trim();
      matchedExcelWeight = String(row['نوع/وزن'] || row['واحد'] || '').trim();
      matchedProductId = productId;

      const currentPercent = percentCol ? cellNumber(excelRow.getCell(percentCol).value) : 0;
      const currentPriceSite = priceSiteCol ? cellNumber(excelRow.getCell(priceSiteCol).value) : 0;
      const currentHasSite = hasSiteCol
        ? String(cellPlainValue(excelRow.getCell(hasSiteCol).value) ?? '').trim()
        : '';
      const currentName = String(row['نام محصول'] || '').trim();
      const currentSlug = String(row.slug || '').trim();
      const currentWeight = String(row['نوع/وزن'] || '').trim();
      const currentUnit = String(row['واحد'] || '').trim();
      const currentCategory = String(row['دسته‌بندی'] || '').trim();
      const currentStatus = String(row['وضعیت'] || '').trim();
      const currentStockStatus = String(
        row.stock_status || cellPlainValue(excelRow.getCell(stockStatusCol).value) || ''
      ).trim();

      const samePrice = previousPrice === ref.priceToman;
      const samePercent =
        !percentCol ||
        (nextHasSite ? currentPercent === nextPercent : currentPercent === 0);
      const sameSitePrice =
        !priceSiteCol ||
        (nextHasSite ? currentPriceSite === nextPriceSite : currentPriceSite === 0);
      const sameHas = !hasSiteCol || currentHasSite === hasSiteLabel;
      const sameName = currentName === ref.productName;
      const sameSlug = !excelSlugValue || currentSlug === excelSlugValue;
      const sameWeight = !ref.variantName || currentWeight === ref.variantName;
      const sameUnit = !ref.variantName || !currentUnit || currentUnit === ref.variantName;
      const sameCategory = nextCategory == null || currentCategory === nextCategory;
      const sameStatus = !nextStatus || currentStatus === nextStatus;
      const sameStock = nextStockStatus == null || currentStockStatus === nextStockStatus;

      // Always mirror «قیمت» (F/G عمده + نام/وزن) even when site_prices is unchanged.
      const siteUnchanged =
        samePrice &&
        samePercent &&
        sameSitePrice &&
        sameHas &&
        sameName &&
        sameSlug &&
        sameWeight &&
        sameUnit &&
        sameCategory &&
        sameStatus &&
        sameStock;

      if (siteUnchanged) {
        matchedRow = rowNumber;
        // حتی اگر «بدون تغییر» به نظر می‌رسد، قیمت را محکم بنویس تا خالی نماند
        priceCell.value = ref.priceToman;
        if (layout.colMap['قیمت خام'] != null) {
          excelRow.getCell(layout.colMap['قیمت خام']).value = ref.priceToman;
        }
        return;
      }

      // همیشه قیمت site_prices را بنویس (حتی ۰)
      priceCell.value = ref.priceToman;
      wroteAny = true;
      if (layout.colMap['قیمت خام'] != null) {
        excelRow.getCell(layout.colMap['قیمت خام']).value = ref.priceToman;
      }

      if (percentCol) {
        excelRow.getCell(percentCol).value = nextHasSite ? nextPercent : '';
        wroteAny = true;
      }
      if (priceSiteCol) {
        excelRow.getCell(priceSiteCol).value = nextHasSite ? nextPriceSite : '';
        wroteAny = true;
      }
      if (hasSiteCol) {
        excelRow.getCell(hasSiteCol).value = hasSiteLabel;
        wroteAny = true;
      }

      // نام/وزن ساختار اکسل مرجع است — با نام Mongo بازنویسی نشود
      // (مگر rename صریح با previousProductName)
      if (ref.previousProductName && ref.productName) {
        setCellIfCol(excelRow, layout.colMap, ['نام محصول'], ref.productName);
      }
      if (excelSlugValue && ref.previousSlug) {
        setCellIfCol(excelRow, layout.colMap, ['slug'], excelSlugValue);
      }
      if (ref.previousVariantName && ref.variantName) {
        setCellIfCol(excelRow, layout.colMap, ['نوع/وزن'], ref.variantName);
        setCellIfCol(excelRow, layout.colMap, ['واحد'], ref.variantName);
      }
      if (nextCategory != null) setCellIfCol(excelRow, layout.colMap, ['دسته‌بندی'], nextCategory);
      if (nextStatus) setCellIfCol(excelRow, layout.colMap, ['وضعیت'], nextStatus);
      if (nextStockStatus) {
        excelRow.getCell(stockStatusCol).value = nextStockStatus;
        wroteAny = true;
      }
      wroteAny = true;

      matchedRow = rowNumber;
    });

    if (matchedRow === -1) {
      return { ok: true, updated: false, matched: true, unchanged: true as const };
    }

    if (!matchedRow) {
      return { ok: true, updated: false, matched: false };
    }

    // Mirror name / weight / base price / wholesale onto «قیمت» using source_row / price_lookup_key
    const priceSheet =
      workbook.getWorksheet('قیمت') ||
      workbook.getWorksheet('قیمت ها') ||
      workbook.getWorksheet('قیمت‌ها');

    let mirroredPriceSheet = false;
    let previousWholesale: number | null = null;
    let nextWholesale: number | null = null;
    let nextWholesaleQty = '';
    let wholesaleChanged = false;
    const baseChanged = previousPrice !== ref.priceToman;

    if (priceSheet && sourceRowNum > 0) {
      ensureWholesaleHeaders(priceSheet);

      const readPriceName = (row: ExcelJS.Row) => {
        const fromValue = String(cellPlainValue(row.getCell(1).value) ?? '').trim();
        if (fromValue) return fromValue;
        return String(row.getCell(1).text || '').trim();
      };

      const findLastNamedPriceRowLocal = () => {
        let last = 1;
        priceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          const name = readPriceName(row);
          if (name && name !== 'نام محصولات') last = Math.max(last, rowNumber);
        });
        return last;
      };

      // اگر source_row به ردیف محصول دیگری در شیت قیمت اشاره کند، ردیف جدید بساز
      let priceRow = priceSheet.getRow(sourceRowNum);
      const existingPriceName = readPriceName(priceRow);
      // فقط وقتی SKU مچ نشده و نام کاملاً فرق دارد — با مچ SKU نام اکسل مرجع حفظ می‌شود
      const matchedBySku = Boolean(
        ref.variantSku &&
          matchedProductId &&
          normalizeProductText(matchedProductId) === normalizeProductText(ref.variantSku)
      );
      const collided =
        !matchedBySku &&
        Boolean(existingPriceName) &&
        existingPriceName !== 'نام محصولات' &&
        normalizeProductText(existingPriceName) !== normalizeProductText(ref.productName);

      if (collided) {
        const newSource = findLastNamedPriceRowLocal() + 1;
        console.warn('[excel][price-sync] source_row collision — reallocating', {
          product: ref.productName,
          oldSource: sourceRowNum,
          occupiedBy: existingPriceName,
          newSource
        });

        const sourceCol = layout.colMap.source_row;
        const lookupCol = layout.colMap.price_lookup_key;
        const nameCol = layout.colMap['نام محصول'];
        const idCol = layout.colMap.product_id ?? layout.colMap.site_key;

        siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
          if (rowNumber <= layout.headerRow) return;
          const rowName = nameCol
            ? String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim()
            : '';
          if (normalizeProductText(rowName) !== normalizeProductText(ref.productName)) return;
          if (sourceCol) excelRow.getCell(sourceCol).value = newSource;
          // کلید پایدار = product_id
          if (lookupCol && idCol) {
            const pid = String(cellPlainValue(excelRow.getCell(idCol).value) ?? '').trim();
            if (pid) excelRow.getCell(lookupCol).value = pid;
          }
          excelRow.commit();
        });

        sourceRowNum = newSource;
        lookupKey = matchedProductId || String(ref.variantSku || '').trim() || lookupKey;
        priceRow = priceSheet.getRow(sourceRowNum);
        // عمده ردیف جدید را پاک نکن مگر لازم باشد — فقط retail
        clearPriceRowRetailSlots(priceRow, { clearWholesale: false, maxCol: 20 });
        wroteAny = true;
      }

      priceRow.getCell(1).value =
        existingPriceName && existingPriceName !== 'نام محصولات'
          ? existingPriceName
          : ref.productName;

      // کلید پایدار: product_id / SKU — نه شمارهٔ ردیف
      const stableLookupKey =
        String(ref.variantSku || '').trim() ||
        matchedProductId ||
        lookupKey ||
        `${sourceRowNum}-1`;

      // مهاجرت کلید قدیمی «۴۰۰-۱» به product_id پایدار
      if (layout.colMap.price_lookup_key && stableLookupKey && matchedRow) {
        const siteRow = siteSheet.getRow(matchedRow);
        const currentKey = String(
          cellPlainValue(siteRow.getCell(layout.colMap.price_lookup_key).value) ?? ''
        ).trim();
        if (currentKey !== stableLookupKey) {
          siteRow.getCell(layout.colMap.price_lookup_key).value = stableLookupKey;
          wroteAny = true;
        }
      }

      const variantIndex = (() => {
        // اگر کلید پایدار SKU است، از شمارهٔ انتهای SKU یا پیش‌فرض ۱ استفاده کن
        const fromSku = /-(\d+)$/.exec(stableLookupKey);
        if (fromSku) return Math.max(1, Number(fromSku[1]));
        const m = /^(\d+)-(\d+)$/.exec(lookupKey);
        if (m) return Math.max(1, Number(m[2]));
        return 1;
      })();

      const cols = priceSheetVariantCols(variantIndex);
      if (cols) {
        const { priceCol: pCol, weightCol } = cols;

        // همیشه قیمت عددی معتبر بنویس (حتی ۰) تا سلول خالی نشود
        const displayPrice = Math.round(Math.max(0, Number(ref.priceToman) || 0) / 1000);
        priceRow.getCell(pCol).value = {
          formula: priceLookupFormula(stableLookupKey),
          result: displayPrice
        };

        const weightToWrite = isGenericVariantLabel(String(ref.variantName || ''))
          ? matchedExcelWeight ||
            String(cellPlainValue(priceRow.getCell(weightCol).value) ?? '').trim() ||
            null
          : ref.variantName;
        if (weightToWrite) {
          priceRow.getCell(weightCol).value = weightToWrite;
        }
      }

      // محصول تک‌واریانت: D/E اشتباه را پاک کن
      const retailVariantCount = (() => {
        const nameCol = layout.colMap['نام محصول'];
        const idCol = layout.colMap.product_id ?? layout.colMap.site_key;
        let count = 0;
        const baseSku = String(ref.variantSku || matchedProductId || '')
          .replace(/-\d+$/, '')
          .trim();
        siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
          if (rowNumber <= layout.headerRow) return;
          const rowName = nameCol
            ? String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim()
            : '';
          if (normalizeProductText(rowName) !== normalizeProductText(ref.productName)) return;
          if (baseSku && idCol) {
            const pid = String(cellPlainValue(excelRow.getCell(idCol).value) ?? '').trim();
            if (pid && !pid.startsWith(baseSku) && !normalizeProductText(pid).startsWith(normalizeProductText(baseSku))) {
              return;
            }
          }
          count += 1;
        });
        return count || 1;
      })();

      if (retailVariantCount <= 1) {
        const second = priceSheetVariantCols(2);
        if (second) {
          priceRow.getCell(second.priceCol).value = null;
          priceRow.getCell(second.weightCol).value = null;
        }
      }

      for (let c = PRICE_SHEET_LAST_COL + 1; c <= PRICE_SHEET_LAST_COL + 4; c++) {
        priceRow.getCell(c).value = null;
      }

      previousWholesale = readWholesalePriceToman(priceRow);
      const previousQty = readWholesaleQty(priceRow);

      // فقط وقتی صراحتاً عمده در این درخواست آمده، F/G را عوض کن
      if (ref.touchWholesale === true && typeof ref.hasWholesale === 'boolean') {
        nextWholesale =
          ref.hasWholesale && ref.wholesalePrice != null && Number(ref.wholesalePrice) >= 0
            ? Math.round(Number(ref.wholesalePrice))
            : null;
        nextWholesaleQty = ref.hasWholesale ? String(ref.wholesaleQty || '').trim() : '';

        writeWholesaleToPriceRow(
          priceRow,
          {
            hasWholesale: Boolean(ref.hasWholesale),
            wholesalePriceToman: ref.wholesalePrice,
            wholesaleQty: ref.wholesaleQty
          },
          priceSheet
        );

        wholesaleChanged =
          Boolean(ref.hasWholesale) !== (previousWholesale != null) ||
          (previousWholesale ?? null) !== (nextWholesale ?? null) ||
          (Boolean(ref.hasWholesale) && previousQty !== nextWholesaleQty);
      } else {
        nextWholesale = previousWholesale;
        nextWholesaleQty = previousQty;
        wholesaleChanged = false;
      }

      mirroredPriceSheet = true;
      priceRow.commit();
    }

    if (!wroteAny && !mirroredPriceSheet) {
      return { ok: true, updated: false, matched: true, unchanged: true as const };
    }

    // اگر فقط mirror قیمت شیت لازم بود ولی قیمت/عمده واقعاً عوض نشده، باز هم ذخیره کن
    // تا نتیجهٔ کش‌شدهٔ فرمول با site_prices هم‌خوان شود
    if (!wroteAny && mirroredPriceSheet && !baseChanged && !wholesaleChanged) {
      // هنوز باید workbook را بنویسیم چون result فرمول را تازه کردیم
    }

    appendChangeLog(workbook, ref, {
      previousPrice,
      newPrice: ref.priceToman,
      previousWholesale,
      newWholesale: nextWholesale,
      wholesaleQty: nextWholesaleQty,
      baseChanged,
      wholesaleChanged
    });

    try {
      const stat = await writeProductsExcelWorkbook(workbook, filePath);
      console.info('[excel][price-sync] saved', {
        filePath,
        size: stat.size,
        previousPrice,
        newPrice: ref.priceToman,
        priceSite: ref.priceSite ?? null,
        hasSitePrice: Boolean(ref.hasSitePrice),
        sitePercent: ref.sitePercent ?? null,
        product: ref.productName,
        variant: ref.variantName,
        slug: excelSlugValue || null,
        wroteAny,
        mirroredPriceSheet,
        baseChanged,
        wholesaleChanged,
        hasWholesale: Boolean(ref.hasWholesale)
      });
    } catch (error) {
      console.error('[excel][price-sync] write failed', {
        filePath,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error
      });
      throw error;
    }

    return {
      ok: true,
      updated: true,
      matched: true,
      previousPrice,
      newPrice: ref.priceToman,
      sourceRow: sourceRowNum || null
    };
  });
}

/**
 * همگام‌سازی یک‌باره شیت «قیمت» از روی site_prices.
 * قیمت‌هایی که قبلاً در site_prices ذخیره شده‌اند ولی ستون‌های B/D/H شیت قیمت
 * به‌روز نشده‌اند را اصلاح می‌کند (فرمول + نتیجهٔ نمایشی).
 */
export async function remirrorPriceSheetFromSitePrices(filePath = resolveProductsExcelPath()) {
  return withProductsExcelLock(async () => {
    try {
      await fs.access(filePath);
    } catch {
      return { ok: false as const, reason: 'excel_file_missing' as const, updated: 0 };
    }

    const workbook = await readProductsExcelWorkbook(filePath);
    const siteSheet = workbook.getWorksheet(PRODUCTS_EXCEL_SHEET);
    if (!siteSheet) {
      return { ok: false as const, reason: 'sheet_missing' as const, updated: 0 };
    }

    const layout = parseSitePricesLayout(siteSheet);
    if (!layout) {
      return { ok: false as const, reason: 'price_toman_column_missing' as const, updated: 0 };
    }

    const priceSheet =
      workbook.getWorksheet('قیمت') ||
      workbook.getWorksheet('قیمت ها') ||
      workbook.getWorksheet('قیمت‌ها');
    if (!priceSheet) {
      return { ok: false as const, reason: 'prices_sheet_missing' as const, updated: 0 };
    }

    ensureWholesaleHeaders(priceSheet);

    // اول برخورد source_row را جدا کن: چند نام محصول روی یک source_row
    const sourceCol = layout.colMap.source_row;
    const lookupCol = layout.colMap.price_lookup_key;
    const nameCol = layout.colMap['نام محصول'];
    if (sourceCol && nameCol) {
      const owners = new Map<number, Map<string, number[]>>();
      siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
        if (rowNumber <= layout.headerRow) return;
        const src = Number(cellPlainValue(excelRow.getCell(sourceCol).value)) || 0;
        const name = String(cellPlainValue(excelRow.getCell(nameCol).value) ?? '').trim();
        if (src < 2 || !name) return;
        const key = normalizeProductText(name);
        if (!owners.has(src)) owners.set(src, new Map());
        const byName = owners.get(src)!;
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(rowNumber);
      });

      let nextFree =
        Math.max(
          1,
          ...Array.from(owners.keys()),
          priceSheet.rowCount || 1,
          priceSheet.actualRowCount || 1
        ) + 1;

      for (const [src, byName] of owners) {
        if (byName.size <= 1) continue;
        // اولین نام مالک اصلی بماند؛ بقیه source جدید بگیرند
        let first = true;
        for (const [, rowNums] of byName) {
          if (first) {
            first = false;
            continue;
          }
          const newSource = nextFree++;
          for (const rowNumber of rowNums) {
            const excelRow = siteSheet.getRow(rowNumber);
            excelRow.getCell(sourceCol).value = newSource;
            if (lookupCol) {
              const oldKey = String(cellPlainValue(excelRow.getCell(lookupCol).value) ?? '').trim();
              const m = /^(\d+)-(\d+)$/.exec(oldKey);
              excelRow.getCell(lookupCol).value = m
                ? `${newSource}-${m[2]}`
                : `${newSource}-1`;
            }
            excelRow.commit();
          }
          console.warn('[excel][remirror] split shared source_row', { from: src, to: newSource });
        }
      }
    }

    // اول همهٔ اسلات خرده‌فروشی را پاک کن تا قیمت قاطی‌شدهٔ قبلی نماند
    const maxPriceRow = Math.max(priceSheet.rowCount || 1, priceSheet.actualRowCount || 1);
    for (let r = 2; r <= maxPriceRow; r++) {
      clearPriceRowRetailSlots(priceSheet.getRow(r), { clearWholesale: false, maxCol: 20 });
    }
    stripPriceSheetExtraColumns(priceSheet);

    let updated = 0;
    let skipped = 0;
    const priceColSite = layout.colMap.price_toman;
    const variantCountBySource = new Map<number, number>();

    siteSheet.eachRow({ includeEmpty: false }, (_excelRow, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;
      const row = readDataRow(siteSheet, rowNumber, layout.colMap);
      const sourceRowNum = Number(row.source_row || 0) || 0;
      if (sourceRowNum < 2) return;
      const lookupKey = String(row.price_lookup_key || '').trim();
      const variantIndex = (() => {
        const m = /^(\d+)-(\d+)$/.exec(lookupKey);
        if (m) return Math.max(1, Number(m[2]));
        return 1;
      })();
      if (variantIndex > PRICE_SHEET_MAX_RETAIL_VARIANTS) return;
      variantCountBySource.set(
        sourceRowNum,
        (variantCountBySource.get(sourceRowNum) || 0) + 1
      );
    });

    siteSheet.eachRow({ includeEmpty: false }, (_excelRow, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;

      const row = readDataRow(siteSheet, rowNumber, layout.colMap);
      const productName = String(row['نام محصول'] || '').trim();
      const productId = String(row.product_id || row.site_key || '').trim();
      if (!productName && !productId) {
        skipped += 1;
        return;
      }

      const sourceRowNum = Number(row.source_row || 0) || 0;
      if (sourceRowNum < 2) {
        skipped += 1;
        return;
      }

      // کلید پایدار = product_id
      const stableKey = productId || String(row.price_lookup_key || '').trim() || `${sourceRowNum}-1`;
      if (layout.colMap.price_lookup_key && productId) {
        siteSheet.getRow(rowNumber).getCell(layout.colMap.price_lookup_key).value = productId;
      }

      const variantIndex = (() => {
        const fromSku = /-(\d+)$/.exec(stableKey);
        if (fromSku) return Math.max(1, Number(fromSku[1]));
        const m = /^(\d+)-(\d+)$/.exec(String(row.price_lookup_key || ''));
        if (m) return Math.max(1, Number(m[2]));
        return 1;
      })();

      if (variantIndex > PRICE_SHEET_MAX_RETAIL_VARIANTS) {
        skipped += 1;
        return;
      }

      const cols = priceSheetVariantCols(variantIndex);
      if (!cols) {
        skipped += 1;
        return;
      }

      const priceToman = cellNumber(
        priceColSite != null
          ? siteSheet.getRow(rowNumber).getCell(priceColSite).value
          : (row.price_toman as ExcelJS.CellValue)
      );
      const weight = String(row['نوع/وزن'] || row['واحد'] || '').trim();
      const { priceCol, weightCol } = cols;
      const priceRow = priceSheet.getRow(sourceRowNum);

      if (productName) {
        priceRow.getCell(1).value = productName;
      }

      priceRow.getCell(priceCol).value = {
        formula: priceLookupFormula(stableKey),
        result: Math.round(Math.max(0, priceToman) / 1000)
      };

      if (weight) {
        priceRow.getCell(weightCol).value = weight;
      }

      // محصول تک‌واریانت: D/E را خالی نگه دار
      if ((variantCountBySource.get(sourceRowNum) || 1) <= 1) {
        const second = priceSheetVariantCols(2);
        if (second) {
          priceRow.getCell(second.priceCol).value = null;
          priceRow.getCell(second.weightCol).value = null;
        }
      }

      priceRow.commit();
      updated += 1;
    });

    stripPriceSheetExtraColumns(priceSheet);

    const stat = await writeProductsExcelWorkbook(workbook, filePath);
    console.info('[excel][remirror-price-sheet] saved', {
      filePath,
      size: stat.size,
      updated,
      skipped
    });

    return { ok: true as const, updated, skipped, size: stat.size };
  });
}

/** Import helper: read site_prices rows (read-only; xlsx). */
export function readSitePricesRowsFromWorkbook(workbook: XLSX.WorkBook) {
  const siteSheet = workbook.Sheets[PRODUCTS_EXCEL_SHEET];
  if (!siteSheet) return null;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(siteSheet, { defval: '' });
  if (!rows.length) return null;
  return { sheet: PRODUCTS_EXCEL_SHEET, rows };
}

/** Legacy sheet reader fallback for old imports. */
export function readLegacyPriceRowsFromWorkbook(workbook: XLSX.WorkBook) {
  const legacyNames = ['قیمت', 'قیمت ها'];
  for (const sheetName of legacyNames) {
    const legacySheet = workbook.Sheets[sheetName];
    if (!legacySheet) continue;

    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(legacySheet, { defval: '' });
    const nameCol = raw[0] && ('نام محصولات' in raw[0] ? 'نام محصولات' : null);
    if (!nameCol) continue;

    const slots = [
      { priceKey: 'قیمت', weightKey: 'وزن' },
      { priceKey: 'قیمت_1', weightKey: 'وزن_1' },
      { priceKey: '__EMPTY', weightKey: '__EMPTY_1' }
    ] as const;

    const normalized: Record<string, unknown>[] = [];
    for (const row of raw) {
      const name = String(row[nameCol] || '').trim();
      if (!name) continue;
      for (const slot of slots) {
        const rawPrice = row[slot.priceKey];
        if (rawPrice === '' || rawPrice == null) continue;
        const priceToman = parseExcelPrice(rawPrice);
        if (!priceToman) continue;
        const variantName = String(row[slot.weightKey] || 'پیش‌فرض').trim() || 'پیش‌فرض';
        normalized.push({
          'نام محصول': name,
          product_id: `${normalizeProductText(name)}_${normalizeProductText(variantName)}`,
          site_key: `${normalizeProductText(name)}_${normalizeProductText(variantName)}`,
          slug: '',
          'دسته‌بندی': '',
          'نوع/وزن': variantName,
          واحد: variantName,
          'قیمت خام': rawPrice,
          price_toman: priceToman,
          وضعیت: 'فعال',
          source_row: 0
        });
      }
    }
    if (normalized.length) return { sheet: sheetName, rows: normalized };
  }
  return null;
}

export function readActivePriceRowsFromWorkbook(workbook: XLSX.WorkBook) {
  return readSitePricesRowsFromWorkbook(workbook) || readLegacyPriceRowsFromWorkbook(workbook);
}

/** @deprecated Only used by legacy import paths. */
export function tomanToLegacyExcelPrice(priceToman: number): number {
  const p = Math.round(Number(priceToman || 0));
  if (p <= 0) return 0;
  if (p >= 10000 && p % 1000 === 0) return p / 1000;
  if (p >= 10000) return Math.round(p / 1000);
  return p;
}
