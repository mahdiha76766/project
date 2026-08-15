import type ExcelJS from 'exceljs';

/** ستون‌های F/G مخصوص قیمت عمده — واریانت‌های خرده‌فروشی از این ستون‌ها رد می‌شوند */
export const WHOLESALE_PRICE_COL = 6;
export const WHOLESALE_QTY_COL = 7;
/** الگوی استایل قیمت عمده ← ستون D */
export const WHOLESALE_PRICE_STYLE_SRC_COL = 4;
/** الگوی استایل مقدار عمده ← ستون E */
export const WHOLESALE_QTY_STYLE_SRC_COL = 5;
export const WHOLESALE_PRICE_HEADER = 'قیمت عمده';
export const WHOLESALE_QTY_HEADER = 'مقدار عمده';

/** حداکثر واریانت خرده‌فروشی روی شیت «قیمت»: B/C و D/E — ستون H/I دیگر استفاده نمی‌شود */
export const PRICE_SHEET_MAX_RETAIL_VARIANTS = 2;
/** آخرین ستون مجاز شیت قیمت (A…G) */
export const PRICE_SHEET_LAST_COL = WHOLESALE_QTY_COL;

const WHITE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' }
};

/**
 * اسلات واریانت روی شیت «قیمت»:
 * ۱ → B/C ، ۲ → D/E
 * واریانت ۳+ روی این شیت نوشته نمی‌شود (H/I حذف شده‌اند).
 */
export function priceSheetVariantCols(variantIndex1Based: number): {
  priceCol: number;
  weightCol: number;
} | null {
  const i = Math.max(1, Math.round(Number(variantIndex1Based) || 1));
  if (i > PRICE_SHEET_MAX_RETAIL_VARIANTS) return null;
  const priceCol = 2 + (i - 1) * 2;
  return { priceCol, weightCol: priceCol + 1 };
}

/** فرمول خواندن قیمت از site_prices (به هزار تومان برای نمایش شیت قیمت) */
export function priceLookupFormula(lookupKey: string) {
  return `IFERROR(IF(OR(INDEX(site_prices!$H:$H,MATCH("${lookupKey}",site_prices!$O:$O,0))="؟",INDEX(site_prices!$H:$H,MATCH("${lookupKey}",site_prices!$O:$O,0))="نامشخص",INDEX(site_prices!$H:$H,MATCH("${lookupKey}",site_prices!$O:$O,0))=""),INDEX(site_prices!$H:$H,MATCH("${lookupKey}",site_prices!$O:$O,0)),INDEX(site_prices!$H:$H,MATCH("${lookupKey}",site_prices!$O:$O,0))/1000),"")`;
}

/** مقدار نمایشی شیت «قیمت» از price_toman سایت (هزار تومان) */
export function priceSheetStaticValueFromSitePrice(priceToman: unknown): number | null {
  if (priceToman === '' || priceToman == null) return null;
  const num = Number(priceToman);
  if (!Number.isFinite(num)) return null;
  return Math.round(Math.max(0, num) / 1000);
}

/**
 * رزرو F/G برای عمده — چیزی پاک نمی‌کند (استایل/مقدار عمده حفظ شود).
 * برای سازگاری با rebuild که قبل از پاک‌سازی retail صدا زده می‌شود.
 */
export function clearLegacyReservedWholesaleCells(_row: ExcelJS.Row) {
  // عمداً no-op: ستون‌های F/G نباید در rebuild خرده پاک شوند
}

/**
 * پاک کردن اسلات‌های خرده‌فروشی B/C/D/E و هر چیز از H به بعد.
 * F/G (عمده) دست نخورده می‌ماند مگر clearWholesale=true.
 */
export function clearPriceRowRetailSlots(
  row: ExcelJS.Row,
  options?: { clearWholesale?: boolean; maxCol?: number }
) {
  for (const col of [2, 3, 4, 5]) {
    row.getCell(col).value = null;
  }
  if (options?.clearWholesale) {
    row.getCell(WHOLESALE_PRICE_COL).value = null;
    row.getCell(WHOLESALE_QTY_COL).value = null;
  }
  const maxCol = Math.max(options?.maxCol ?? 20, 9);
  for (let col = PRICE_SHEET_LAST_COL + 1; col <= maxCol; col++) {
    row.getCell(col).value = null;
  }
}

/**
 * ستون‌های H به بعد را از کل شیت «قیمت» پاک و حذف می‌کند.
 * جلوی قاطی‌شدن قیمت محصول‌ها در اسلات سوم+ را می‌گیرد.
 */
export function stripPriceSheetExtraColumns(priceSheet: ExcelJS.Worksheet) {
  const rowCount = Math.max(priceSheet.rowCount || 1, priceSheet.actualRowCount || 1, 1);
  const colCount = Math.max(priceSheet.columnCount || PRICE_SHEET_LAST_COL, 9);

  for (let r = 1; r <= rowCount; r++) {
    const row = priceSheet.getRow(r);
    for (let c = PRICE_SHEET_LAST_COL + 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      // استایل اضافه را هم خنثی کن تا ستون خالی دیده نشود
      cell.style = {};
    }
    row.commit();
  }

  const extra = colCount - PRICE_SHEET_LAST_COL;
  if (extra > 0) {
    try {
      priceSheet.spliceColumns(PRICE_SHEET_LAST_COL + 1, extra);
    } catch (error) {
      console.warn('[excel][price-layout] spliceColumns H+ failed', error);
    }
  }

  // هدر فقط تا G
  const header = priceSheet.getRow(1);
  for (let c = PRICE_SHEET_LAST_COL + 1; c <= PRICE_SHEET_LAST_COL + 4; c++) {
    header.getCell(c).value = null;
  }
}

/**
 * کپی کامل استایل از طریق style bag (در ExcelJS فقط fill= کافی نیست و ممکن است theme گم شود).
 */
export function copyCellStyleExact(source: ExcelJS.Cell, target: ExcelJS.Cell) {
  const next: Partial<ExcelJS.Style> = { ...(target.style || {}) };

  if (source.font) next.font = { ...source.font };
  if (source.border) next.border = JSON.parse(JSON.stringify(source.border));
  if (source.alignment) next.alignment = { ...source.alignment };
  if (source.protection) next.protection = { ...source.protection };

  if (source.fill) {
    next.fill = JSON.parse(JSON.stringify(source.fill));
  } else {
    next.fill = { type: 'pattern', pattern: 'none' };
  }

  if (source.numFmt) next.numFmt = source.numFmt;
  else delete next.numFmt;

  target.style = next as ExcelJS.Style;
}

function findStyleDonorRow(
  priceSheet: ExcelJS.Worksheet,
  preferredRow: ExcelJS.Row,
  styleCol: number
) {
  const preferred = preferredRow.getCell(styleCol);
  const preferredFill = preferred.fill as ExcelJS.FillPattern | undefined;
  if (preferredFill?.pattern === 'solid' && preferredFill.fgColor) return preferredRow;

  const last = Math.min(priceSheet.rowCount || 40, 80);
  for (let r = 2; r <= last; r++) {
    const row = priceSheet.getRow(r);
    const fill = row.getCell(styleCol).fill as ExcelJS.FillPattern | undefined;
    if (fill?.pattern === 'solid' && fill.fgColor) return row;
  }
  return preferredRow;
}

export function ensureWholesaleHeaders(priceSheet: ExcelJS.Worksheet) {
  const header = priceSheet.getRow(1);
  const srcPrice = header.getCell(WHOLESALE_PRICE_STYLE_SRC_COL);
  const srcQty = header.getCell(WHOLESALE_QTY_STYLE_SRC_COL);
  const priceHeader = header.getCell(WHOLESALE_PRICE_COL);
  const qtyHeader = header.getCell(WHOLESALE_QTY_COL);

  copyCellStyleExact(srcPrice, priceHeader);
  copyCellStyleExact(srcQty, qtyHeader);

  // ردیف ۱: بک‌گراند سفید fore F و G
  const whiteHeader = (cell: ExcelJS.Cell, label: string) => {
    const next: Partial<ExcelJS.Style> = { ...(cell.style || {}) };
    next.fill = { ...WHITE_FILL };
    delete next.numFmt;
    cell.style = next as ExcelJS.Style;
    cell.value = label;
  };

  whiteHeader(priceHeader, WHOLESALE_PRICE_HEADER);
  whiteHeader(qtyHeader, WHOLESALE_QTY_HEADER);

  // هدر H/I و بعد را خالی نگه دار
  for (let c = PRICE_SHEET_LAST_COL + 1; c <= PRICE_SHEET_LAST_COL + 4; c++) {
    header.getCell(c).value = null;
  }
}

export function writeWholesaleToPriceRow(
  priceRow: ExcelJS.Row,
  opts: {
    hasWholesale: boolean;
    wholesalePriceToman?: number | null;
    wholesaleQty?: string | null;
  },
  priceSheet?: ExcelJS.Worksheet
) {
  const priceCell = priceRow.getCell(WHOLESALE_PRICE_COL);
  const qtyCell = priceRow.getCell(WHOLESALE_QTY_COL);

  if (priceSheet) {
    const priceDonor = findStyleDonorRow(priceSheet, priceRow, WHOLESALE_PRICE_STYLE_SRC_COL);
    const qtyDonor = findStyleDonorRow(priceSheet, priceRow, WHOLESALE_QTY_STYLE_SRC_COL);
    // اگر D خالی از fill بود، از B (قیمت) و برای E از C (وزن) استفاده کن
    const priceSrcCell = (() => {
      const c = priceDonor.getCell(WHOLESALE_PRICE_STYLE_SRC_COL);
      const fill = c.fill as ExcelJS.FillPattern | undefined;
      if (fill?.pattern === 'solid' && fill.fgColor) return c;
      return priceDonor.getCell(2);
    })();
    const qtySrcCell = (() => {
      const c = qtyDonor.getCell(WHOLESALE_QTY_STYLE_SRC_COL);
      const fill = c.fill as ExcelJS.FillPattern | undefined;
      if (fill?.pattern === 'solid' && fill.fgColor) return c;
      return qtyDonor.getCell(3);
    })();
    copyCellStyleExact(priceSrcCell, priceCell);
    copyCellStyleExact(qtySrcCell, qtyCell);
  } else {
    copyCellStyleExact(priceRow.getCell(WHOLESALE_PRICE_STYLE_SRC_COL), priceCell);
    copyCellStyleExact(priceRow.getCell(WHOLESALE_QTY_STYLE_SRC_COL), qtyCell);
  }

  if (opts.hasWholesale && opts.wholesalePriceToman != null && Number(opts.wholesalePriceToman) >= 0) {
    priceCell.value = Math.round(Number(opts.wholesalePriceToman) / 1000);
    qtyCell.value = String(opts.wholesaleQty || '').trim() || null;
  } else {
    priceCell.value = null;
    qtyCell.value = null;
  }
}
