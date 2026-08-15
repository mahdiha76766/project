import 'server-only';

import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import {
  PRODUCTS_EXCEL_SHEET,
  resolveProductsExcelPath
} from '@/lib/admin/product-excel-import';
import { ensureStockStatusColumn } from '@/lib/admin/product-excel-sync';
import {
  WHOLESALE_QTY_COL,
  PRICE_SHEET_LAST_COL,
  PRICE_SHEET_MAX_RETAIL_VARIANTS,
  clearPriceRowRetailSlots,
  ensureWholesaleHeaders,
  priceLookupFormula,
  priceSheetVariantCols,
  stripPriceSheetExtraColumns
} from '@/lib/admin/product-excel-price-layout';
import {
  materializeSharedFormulasInSheet,
  readProductsExcelWorkbook,
  withProductsExcelLock,
  writeProductsExcelWorkbook
} from '@/lib/admin/product-excel-io';
import { comparePersianNames } from '@/lib/admin/persian-sort';
import { STOCK_STATUS_AVAILABLE, type StockStatusLabel } from '@/lib/shop/stock-status';
import { coercePriceToman } from '@/lib/shop/price-currency';
import {
  buildBaseProductSlug,
  buildVariantProductSlug,
  formatNewProductId,
  parseProductCodeSeq
} from '@/lib/admin/product-codes';

/** شیت لیست قیمت روزمره (فرمول‌ها از site_prices می‌خوانند) */
export const LEGACY_PRICES_SHEET = 'قیمت';

export type NewProductVariantInput = {
  weight: string;
  priceToman: number;
};

export type AppendNewProductInput = {
  name: string;
  variants: NewProductVariantInput[];
  categoryName?: string;
  stockStatus?: StockStatusLabel;
  /** حداقل شماره ترتیبی SKU (مثلاً max(Mongo)+1) تا با دیتابیس برخورد نکند */
  preferredSeq?: number;
};

export type AppendedVariant = {
  productId: string;
  weight: string;
  priceToman: number;
  priceLookupKey: string;
  slug: string;
};

function cloneCellValue(value: ExcelJS.CellValue): ExcelJS.CellValue {
  if (value == null) return null;
  if (typeof value !== 'object') return value;
  if ('formula' in value) {
    const formula = String((value as ExcelJS.CellFormulaValue).formula || '');
    const result = (value as ExcelJS.CellFormulaValue).result;
    // shareType/ref را عمداً حذف می‌کنیم تا shared نماند
    if (!formula) {
      return result !== undefined && result !== null ? (result as ExcelJS.CellValue) : null;
    }
    return result !== undefined && result !== null ? { formula, result } : { formula };
  }
  if ('sharedFormula' in value) {
    // بدون دسترسی به cell.formula فقط result امن است؛
    // قبل از snapshot، materializeSharedFormulasInSheet صداده می‌شود.
    const shared = value as ExcelJS.CellSharedFormulaValue & { formula?: string };
    if (shared.formula) {
      return shared.result !== undefined && shared.result !== null
        ? { formula: String(shared.formula), result: shared.result }
        : { formula: String(shared.formula) };
    }
    if (shared.result !== undefined && shared.result !== null) {
      return shared.result as ExcelJS.CellValue;
    }
    return null;
  }
  if ('richText' in value && Array.isArray((value as ExcelJS.CellRichTextValue).richText)) {
    return {
      richText: (value as ExcelJS.CellRichTextValue).richText.map((p) => ({ ...p }))
    };
  }
  if ('text' in value) return { ...(value as object) } as ExcelJS.CellValue;
  return value;
}

type PriceRowSnapshot = {
  oldRow: number;
  name: string;
  maxCol: number;
  height?: number;
  cells: Array<{
    col: number;
    value: ExcelJS.CellValue;
    font?: Partial<ExcelJS.Font>;
    fill?: ExcelJS.Fill;
    border?: Partial<ExcelJS.Borders>;
    alignment?: Partial<ExcelJS.Alignment>;
    numFmt?: string;
  }>;
};

function snapshotCellLook(cell: ExcelJS.Cell) {
  return {
    font: cell.font ? { ...cell.font } : undefined,
    fill: cell.fill ? (JSON.parse(JSON.stringify(cell.fill)) as ExcelJS.Fill) : undefined,
    border: cell.border ? (JSON.parse(JSON.stringify(cell.border)) as Partial<ExcelJS.Borders>) : undefined,
    alignment: cell.alignment ? { ...cell.alignment } : undefined,
    numFmt: cell.numFmt || undefined
  };
}

function readPriceRowName(row: ExcelJS.Row) {
  const cell = row.getCell(1);
  const fromValue = String(cellPlainValue(cell.value) ?? '').trim();
  if (fromValue) return fromValue;
  const fromText = String(cell.text || '').trim();
  return fromText;
}

function clearPriceRow(row: ExcelJS.Row, maxCol: number) {
  for (let c = 1; c <= maxCol; c++) {
    const cell = row.getCell(c);
    cell.value = null;
  }
  row.commit();
}

/**
 * سورت الفبایی دقیق شیت «قیمت» + remap کردن source_row / price_lookup_key در site_prices.
 * ردیف‌ها از ردیف ۲ پشت‌سرهم چیده می‌شوند و فرمول‌های MATCH با کلید جدید بازنویسی می‌شوند.
 */
export function sortPricesSheetAlphabetically(
  priceSheet: ExcelJS.Worksheet,
  siteSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  // قبل از جابه‌جایی ردیف‌ها، shared formulaها را مستقل کن
  materializeSharedFormulasInSheet(priceSheet);
  materializeSharedFormulasInSheet(siteSheet);

  const snapshots: PriceRowSnapshot[] = [];
  let sheetMaxCol = Math.max(PRICE_SHEET_LAST_COL, WHOLESALE_QTY_COL);

  const lastRow = Math.max(priceSheet.rowCount || 1, priceSheet.actualRowCount || 1);
  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = priceSheet.getRow(rowNumber);
    const name = readPriceRowName(row);
    if (!name || name === 'نام محصولات') continue;

    const cells: PriceRowSnapshot['cells'] = [];
    let rowMax = 1;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber > rowMax) rowMax = colNumber;
      if (colNumber > sheetMaxCol) sheetMaxCol = colNumber;
      cells.push({
        col: colNumber,
        value: cloneCellValue(cell.value),
        ...snapshotCellLook(cell)
      });
    });

    // اگر فقط نام دارد و eachCell چیزی نداد
    if (!cells.some((c) => c.col === 1)) {
      cells.unshift({ col: 1, value: name });
    } else {
      const nameCell = cells.find((c) => c.col === 1);
      if (nameCell) nameCell.value = name;
    }

    snapshots.push({
      oldRow: rowNumber,
      name,
      maxCol: Math.max(PRICE_SHEET_LAST_COL, Math.min(rowMax, PRICE_SHEET_LAST_COL)),
      height: row.height,
      cells
    });
  }

  if (!snapshots.length) {
    return { remapped: new Map<number, number>(), startRow: 2 };
  }

  if (snapshots.length === 1) {
    const only = snapshots[0];
    // حتی یک ردیف را هم به ردیف ۲ منتقل کن اگر جای دیگری است
    if (only.oldRow === 2) {
      return {
        remapped: new Map<number, number>([[only.oldRow, only.oldRow]]),
        startRow: 2
      };
    }
  }

  snapshots.sort((a, b) => {
    const byName = comparePersianNames(a.name, b.name);
    if (byName !== 0) return byName;
    return a.oldRow - b.oldRow;
  });

  const startRow = 2;
  const remapped = new Map<number, number>();
  for (let i = 0; i < snapshots.length; i++) {
    remapped.set(snapshots[i].oldRow, startRow + i);
  }

  const lastOld = Math.max(lastRow, ...snapshots.map((s) => s.oldRow));
  for (let r = startRow; r <= lastOld; r++) {
    clearPriceRow(priceSheet.getRow(r), sheetMaxCol);
  }

  const replaceLookupInFormula = (formula: string, oldRow: number, newRow: number) =>
    formula.replace(new RegExp(`"${oldRow}-(\\d+)"`, 'g'), `"${newRow}-$1"`);

  for (let i = 0; i < snapshots.length; i++) {
    const snap = snapshots[i];
    const newRowNum = startRow + i;
    const dest = priceSheet.getRow(newRowNum);
    if (snap.height != null) dest.height = snap.height;

    // فقط تا G را بازبنویس — H+ را عمداً کپی نکن تا قیمت محصول‌ها قاطی نشود
    for (const cell of snap.cells) {
      if (cell.col > PRICE_SHEET_LAST_COL) continue;
      let value = cell.value;
      if (value && typeof value === 'object' && 'formula' in value) {
        const formula = replaceLookupInFormula(String(value.formula || ''), snap.oldRow, newRowNum);
        value =
          (value as ExcelJS.CellFormulaValue).result !== undefined
            ? { formula, result: (value as ExcelJS.CellFormulaValue).result }
            : { formula };
      }
      const target = dest.getCell(cell.col);
      target.value = value;
      if (cell.font) target.font = cell.font;
      if (cell.fill) target.fill = cell.fill;
      if (cell.border) target.border = cell.border;
      if (cell.alignment) target.alignment = cell.alignment;
      if (cell.numFmt) target.numFmt = cell.numFmt;
    }

    // نام همیشه در ستون A نوشته شود تا سورت پایدار بماند
    dest.getCell(1).value = snap.name;
    // بقایای H/I روی ردیف مقصد
    for (let c = PRICE_SHEET_LAST_COL + 1; c <= sheetMaxCol; c++) {
      dest.getCell(c).value = null;
    }
    dest.commit();
  }

  stripPriceSheetExtraColumns(priceSheet);

  const sourceCol = layout.colMap.source_row;
  const lookupCol = layout.colMap.price_lookup_key;
  if (sourceCol) {
    siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;
      const oldSource = Number(cellPlainValue(excelRow.getCell(sourceCol).value));
      if (!Number.isFinite(oldSource) || !remapped.has(oldSource)) return;
      const newSource = remapped.get(oldSource)!;

      excelRow.getCell(sourceCol).value = newSource;
      if (lookupCol) {
        const oldKey = String(cellPlainValue(excelRow.getCell(lookupCol).value) ?? '').trim();
        const m = /^(\d+)-(\d+)$/.exec(oldKey);
        if (m && Number(m[1]) === oldSource) {
          excelRow.getCell(lookupCol).value = `${newSource}-${m[2]}`;
        }
      }
      excelRow.commit();
    });
  }

  return { remapped, startRow };
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

/** Deep-copy visual style of a cell onto another (font / fill / border / alignment / numFmt). */
export function copyCellStyle(source: ExcelJS.Cell, target: ExcelJS.Cell) {
  if (source.font) target.font = { ...source.font };
  if (source.fill) target.fill = JSON.parse(JSON.stringify(source.fill));
  if (source.border) target.border = JSON.parse(JSON.stringify(source.border));
  if (source.alignment) target.alignment = { ...source.alignment };
  if (source.numFmt) target.numFmt = source.numFmt;
  if (source.protection) target.protection = { ...source.protection };
}

/** Copy full row look (height + per-cell styles) from template → destination. */
export function copyRowLook(template: ExcelJS.Row, dest: ExcelJS.Row, maxCol: number) {
  if (template.height != null) dest.height = template.height;
  for (let c = 1; c <= maxCol; c++) {
    copyCellStyle(template.getCell(c), dest.getCell(c));
  }
}

function findLastSiteDataRow(
  sheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  let last = layout.headerRow;
  const idCol = layout.colMap.product_id;
  const nameCol = layout.colMap['نام محصول'];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= layout.headerRow) return;
    const id = idCol ? String(cellPlainValue(row.getCell(idCol).value) ?? '').trim() : '';
    const name = nameCol ? String(cellPlainValue(row.getCell(nameCol).value) ?? '').trim() : '';
    if (id || name) last = rowNumber;
  });
  return last;
}

/** فقط ردیف‌هایی که واقعاً نام محصول دارند (نه lastRow خام که می‌تواند فاصله خالی بزرگ بسازد). */
export function findLastNamedPriceRow(priceSheet: ExcelJS.Worksheet) {
  let last = 1;
  priceSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const name = String(cellPlainValue(row.getCell(1).value) ?? '').trim();
    if (name && name !== 'نام محصولات') last = Math.max(last, rowNumber);
  });
  return last;
}

function nextSourceRow(
  siteSheet: ExcelJS.Worksheet,
  priceSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  let maxSource = 0;
  const sourceCol = layout.colMap.source_row;
  if (sourceCol) {
    siteSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= layout.headerRow) return;
      const n = Number(cellPlainValue(row.getCell(sourceCol).value));
      if (Number.isFinite(n) && n > maxSource) maxSource = n;
    });
  }

  const lastPriceRow = findLastNamedPriceRow(priceSheet);
  let candidate = Math.max(maxSource, lastPriceRow) + 1;

  // هرگز روی ردیفی که هنوز نام دارد ننویس (باقی‌ماندهٔ سلول‌ها باعث قاطی قیمت می‌شود)
  while (candidate < lastPriceRow + 5000) {
    const existingName = readPriceRowName(priceSheet.getRow(candidate));
    if (!existingName || existingName === 'نام محصولات') break;
    candidate += 1;
  }
  return candidate;
}

/**
 * شماره بعدی NS-NEW را از روی product_idهای موجود در اکسل می‌گیرد.
 * مهم: بعد از سورت الفبایی، source_row فشرده می‌شود ولی NS-NEW-XXXX قدیمی می‌ماند؛
 * بنابراین نباید SKU را از روی source_row ساخت.
 */
function nextNsNewSeqFromSheet(
  siteSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  let max = 0;
  const idCol = layout.colMap.product_id ?? layout.colMap.site_key;
  const keyCol = layout.colMap.site_key;
  siteSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= layout.headerRow) return;
    if (idCol) max = Math.max(max, parseProductCodeSeq(cellPlainValue(row.getCell(idCol).value)));
    if (keyCol && keyCol !== idCol) {
      max = Math.max(max, parseProductCodeSeq(cellPlainValue(row.getCell(keyCol).value)));
    }
  });
  return max + 1;
}

function collectExistingSlugs(
  siteSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  const slugs = new Set<string>();
  const slugCol = layout.colMap.slug;
  if (!slugCol) return slugs;
  siteSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= layout.headerRow) return;
    const slug = String(cellPlainValue(row.getCell(slugCol).value) ?? '')
      .trim()
      .toLowerCase();
    if (slug) slugs.add(slug);
  });
  return slugs;
}

function uniquifyExcelSlug(baseSlug: string, existing: Set<string>, seq: number) {
  let slug = baseSlug || `product_${String(seq).padStart(4, '0')}`;
  if (!existing.has(slug.toLowerCase())) {
    existing.add(slug.toLowerCase());
    return slug;
  }
  let i = 2;
  while (existing.has(`${baseSlug}_${i}`.toLowerCase()) && i < 5000) i += 1;
  slug = `${baseSlug}_${i}`;
  if (existing.has(slug.toLowerCase())) {
    slug = `${baseSlug}_${seq}_${Date.now().toString(36)}`;
  }
  existing.add(slug.toLowerCase());
  return slug;
}

function maxUsedCol(row: ExcelJS.Row, fallback = 15) {
  let max = fallback;
  row.eachCell({ includeEmpty: false }, (_cell, colNumber) => {
    if (colNumber > max) max = colNumber;
  });
  return max;
}

/**
 * Appends a new product to site_prices (one row per weight/price)
 * and mirrors it on sheet «قیمت» right after the last written record,
 * copying the visual format of the row above.
 */
export async function appendNewProductToExcel(
  input: AppendNewProductInput,
  filePath = resolveProductsExcelPath()
) {
  return withProductsExcelLock(() => appendNewProductToExcelUnlocked(input, filePath));
}

async function appendNewProductToExcelUnlocked(
  input: AppendNewProductInput,
  filePath: string
) {
  const name = String(input.name || '').trim();
  const categoryName = String(input.categoryName || '').trim();
  const stockStatus = input.stockStatus || STOCK_STATUS_AVAILABLE;
  let variants = (input.variants || [])
    .map((v) => ({
      weight: String(v.weight || '').trim(),
      // قیمت خالی / نامعتبر / ؟ → ۰؛ محصول همچنان در اکسل نگه داشته می‌شود
      priceToman: coercePriceToman(v.priceToman)
    }))
    .filter((v) => Number.isFinite(v.priceToman) && v.priceToman >= 0);

  if (!name) {
    return { ok: false as const, reason: 'name_required' as const };
  }
  // حتی بدون واریانت ورودی، یک ردیف با قیمت ۰ بساز
  if (!variants.length) {
    variants = [{ weight: '', priceToman: 0 }];
  }

  try {
    await fs.access(filePath);
  } catch {
    console.error('[excel][append-product] file missing', { filePath, uploadsDir: process.env.UPLOADS_DIR });
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

  const sourceRow = nextSourceRow(siteSheet, priceSheet, layout);
  const productSeq = Math.max(
    nextNsNewSeqFromSheet(siteSheet, layout),
    Math.max(1, Math.round(Number(input.preferredSeq) || 0))
  );
  const existingSlugs = collectExistingSlugs(siteSheet, layout);
  const baseSlug = uniquifyExcelSlug(buildBaseProductSlug(name, productSeq), existingSlugs, productSeq);
  const col = layout.colMap;

  const lastSiteDataRow = findLastSiteDataRow(siteSheet, layout);
  const siteTemplate = siteSheet.getRow(Math.max(lastSiteDataRow, layout.headerRow + 1));
  const stockStatusCol = ensureStockStatusColumn(siteSheet, layout);
  const siteMaxCol = Math.max(maxUsedCol(siteTemplate, 15), ...Object.values(col), stockStatusCol);

  const lastPriceDataRow = findLastNamedPriceRow(priceSheet);
  const priceTemplate = priceSheet.getRow(Math.max(lastPriceDataRow, 3));
  const lastVariantCols = priceSheetVariantCols(
    Math.min(variants.length, PRICE_SHEET_MAX_RETAIL_VARIANTS)
  );
  const priceMaxCol = Math.max(
    maxUsedCol(priceTemplate, PRICE_SHEET_LAST_COL),
    lastVariantCols?.weightCol ?? 5,
    WHOLESALE_QTY_COL,
    PRICE_SHEET_LAST_COL
  );

  ensureWholesaleHeaders(priceSheet);

  const setCell = (excelRow: ExcelJS.Row, label: string | undefined, value: ExcelJS.CellValue) => {
    if (!label || col[label] == null) return;
    excelRow.getCell(col[label]).value = value;
  };

  const appended: AppendedVariant[] = [];

  for (let i = 0; i < variants.length; i++) {
    const variantIndex = i + 1;
    const weight = variants[i].weight || (variants.length === 1 ? '' : `وزن ${variantIndex}`);
    const priceToman = variants[i].priceToman;
    // SKU یکتای سراسری — وابسته به source_row سورت‌شده نیست
    const productId = formatNewProductId(productSeq, variantIndex);
    // کلید پایدار = همان product_id (دیگر به source_row وابسته نیست تا سورت خرابش نکند)
    const priceLookupKey = productId;
    const slug = uniquifyExcelSlug(
      buildVariantProductSlug(baseSlug, weight, variantIndex),
      existingSlugs,
      productSeq
    );

    // دقیقاً بعد از آخرین رکورد داده‌ای (نه انتهای ابعاد خالی شیت)
    const targetRowNumber = lastSiteDataRow + 1 + i;
    const excelRow = siteSheet.getRow(targetRowNumber);
    copyRowLook(siteTemplate, excelRow, siteMaxCol);

    setCell(excelRow, 'product_id', productId);
    setCell(excelRow, 'نام محصول', name);
    setCell(excelRow, 'slug', slug);
    setCell(excelRow, 'دسته‌بندی', categoryName);
    setCell(excelRow, 'نوع/وزن', weight);
    setCell(excelRow, 'واحد', weight);
    setCell(excelRow, 'قیمت خام', priceToman);
    setCell(excelRow, 'price_toman', priceToman);
    setCell(excelRow, 'درصد', '');
    setCell(excelRow, 'precent', '');
    setCell(excelRow, 'percent', '');
    setCell(excelRow, 'قیمت سایت', '');
    setCell(excelRow, 'price_site', '');
    setCell(excelRow, 'قیمت سایت جداگانه', 'خیر');
    setCell(excelRow, 'has_site_price', 'خیر');
    setCell(excelRow, 'وضعیت', 'فعال');
    excelRow.getCell(stockStatusCol).value = stockStatus;
    setCell(excelRow, 'source_row', sourceRow);
    setCell(excelRow, 'site_key', productId);
    setCell(excelRow, 'price_lookup_key', priceLookupKey);
    excelRow.commit();

    appended.push({ productId, weight, priceToman, priceLookupKey, slug });
  }

  // شیت قیمت: ردیف تمیز بساز — اول همهٔ اسلات‌های خرده‌فروشی/اضافه را پاک کن
  // تا دادهٔ ردیف قالب (مثلاً نوتلا) روی محصول جدید نماند
  const priceExcelRow = priceSheet.getRow(sourceRow);
  copyRowLook(priceTemplate, priceExcelRow, Math.min(priceMaxCol, PRICE_SHEET_LAST_COL));
  clearPriceRowRetailSlots(priceExcelRow, { clearWholesale: true, maxCol: Math.max(priceMaxCol, 20) });
  priceExcelRow.getCell(1).value = name;

  const retailVariantCount = Math.min(variants.length, PRICE_SHEET_MAX_RETAIL_VARIANTS);
  for (let i = 0; i < retailVariantCount; i++) {
    const cols = priceSheetVariantCols(i + 1);
    if (!cols) continue;
    const { priceCol, weightCol } = cols;
    // باید با price_lookup_key در site_prices یکی باشد (= product_id پایدار)
    const lookupKey = appended[i]?.priceLookupKey || appended[i]?.productId;
    if (!lookupKey) continue;
    // استایل از همان ستون‌های قالب (اگر وجود داشت)
    const tplPriceCol = Math.min(priceCol, PRICE_SHEET_LAST_COL);
    const tplWeightCol = Math.min(weightCol, PRICE_SHEET_LAST_COL);
    copyCellStyle(priceTemplate.getCell(tplPriceCol), priceExcelRow.getCell(priceCol));
    copyCellStyle(priceTemplate.getCell(tplWeightCol), priceExcelRow.getCell(weightCol));

    priceExcelRow.getCell(priceCol).value = {
      formula: priceLookupFormula(lookupKey),
      result: Math.round(variants[i].priceToman / 1000)
    };
    priceExcelRow.getCell(weightCol).value = variants[i].weight || null;
  }

  // هدر فقط برای اسلات‌های B/C و D/E
  if (retailVariantCount > 0) {
    const header = priceSheet.getRow(1);
    for (let i = 0; i < retailVariantCount; i++) {
      const cols = priceSheetVariantCols(i + 1);
      if (!cols) continue;
      if (!header.getCell(cols.priceCol).value) header.getCell(cols.priceCol).value = 'قیمت';
      if (!header.getCell(cols.weightCol).value) header.getCell(cols.weightCol).value = 'وزن';
    }
  }

  priceExcelRow.commit();

  // سورت الفبایی عمداً اینجا صدا زده نمی‌شود.
  // سورت source_row را جابه‌جا می‌کند و باعث خالی‌شدن قیمت، جابه‌جایی و رکورد تکراری می‌شود.
  // برای سورت دستی: npm run excel:remirror / اسکریپت سورت جدا.
  stripPriceSheetExtraColumns(priceSheet);

  try {
    await writeProductsExcelWorkbook(workbook, filePath);
  } catch (error) {
    console.error('[excel][append-product] write failed', {
      filePath,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error
    });
    throw error;
  }

  console.info('[excel][append-product] saved', {
    filePath,
    name,
    sourceRow,
    productSeq,
    baseSlug,
    siteRowsFrom: lastSiteDataRow + 1,
    variants: appended.length,
    skus: appended.map((v) => v.productId),
    sorted: false
  });

  return {
    ok: true as const,
    sourceRow,
    baseSlug,
    productSeq,
    productName: name,
    variants: appended
  };
}
