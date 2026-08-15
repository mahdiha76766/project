import type ExcelJS from 'exceljs';
import {
  clearLegacyReservedWholesaleCells,
  clearPriceRowRetailSlots,
  ensureWholesaleHeaders,
  priceSheetStaticValueFromSitePrice,
  priceSheetVariantCols,
  stripPriceSheetExtraColumns,
  PRICE_SHEET_MAX_RETAIL_VARIANTS,
  PRICE_SHEET_LAST_COL
} from '@/lib/admin/product-excel-price-layout';

const SITE_PRICES_SHEET = 'site_prices';

function cellPlainValue(value: ExcelJS.CellValue): unknown {
  if (value == null) return '';
  if (typeof value === 'object') {
    if ('result' in value && value.result != null) return value.result;
    if ('text' in value && value.text != null) return value.text;
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('');
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
  for (let rowNumber = 1; rowNumber <= maxScan; rowNumber++) {
    const colMap = buildColMap(sheet.getRow(rowNumber));
    if (colMap.price_toman != null) return { headerRow: rowNumber, colMap };
  }
  return null;
}

function nextVariantIndex(lookupKey: string, used: Set<number>) {
  const matched = /^(?:\d+)-(\d+)$/.exec(lookupKey);
  const requested = matched ? Math.max(1, Number(matched[1])) : 0;
  if (requested && !used.has(requested)) return requested;

  let fallback = 1;
  while (used.has(fallback)) fallback += 1;
  return fallback;
}

/**
 * Rebuilds the retail price/weight cells in «قیمت» from static site_prices values.
 * Only cell contents are replaced; all row/column styling and wholesale F/G values stay intact.
 */
export function rebuildPriceSheetFromSitePrices(workbook: ExcelJS.Workbook) {
  const siteSheet = workbook.getWorksheet(SITE_PRICES_SHEET);
  if (!siteSheet) {
    return { ok: false as const, reason: 'sheet_missing' as const, updated: 0, skipped: 0 };
  }

  const layout = parseSitePricesLayout(siteSheet);
  if (!layout) {
    return {
      ok: false as const,
      reason: 'price_toman_column_missing' as const,
      updated: 0,
      skipped: 0
    };
  }

  const priceSheet =
    workbook.getWorksheet('قیمت') ||
    workbook.getWorksheet('قیمت ها') ||
    workbook.getWorksheet('قیمت‌ها');
  if (!priceSheet) {
    return {
      ok: false as const,
      reason: 'prices_sheet_missing' as const,
      updated: 0,
      skipped: 0
    };
  }

  const nameCol = layout.colMap['نام محصول'];
  const idCol = layout.colMap.product_id ?? layout.colMap.site_key;
  const sourceCol = layout.colMap.source_row;
  const lookupCol = layout.colMap.price_lookup_key;
  const priceCol = layout.colMap.price_toman;
  const weightCol = layout.colMap['نوع/وزن'] ?? layout.colMap['واحد'];

  const usedVariantsByRow = new Map<number, Set<number>>();
  const entries: Array<{
    sourceRow: number;
    variantIndex: number;
    productName: string;
    price: unknown;
    weight: string;
  }> = [];
  let skipped = 0;
  let maxVariantIndex = 2;
  let maxSourceRow = 1;

  siteSheet.eachRow({ includeEmpty: false }, (siteRow, rowNumber) => {
    if (rowNumber <= layout.headerRow) return;

    const productName = nameCol
      ? String(cellPlainValue(siteRow.getCell(nameCol).value) ?? '').trim()
      : '';
    const productId = idCol
      ? String(cellPlainValue(siteRow.getCell(idCol).value) ?? '').trim()
      : '';
    const sourceRow = sourceCol
      ? Number(cellPlainValue(siteRow.getCell(sourceCol).value)) || 0
      : 0;
    if ((!productName && !productId) || sourceRow < 2) {
      skipped += 1;
      return;
    }

    const lookupKey = lookupCol
      ? String(cellPlainValue(siteRow.getCell(lookupCol).value) ?? '').trim()
      : '';
    const used = usedVariantsByRow.get(sourceRow) || new Set<number>();
    const variantIndex = nextVariantIndex(lookupKey, used);
    if (variantIndex > PRICE_SHEET_MAX_RETAIL_VARIANTS) {
      skipped += 1;
      return;
    }
    used.add(variantIndex);
    usedVariantsByRow.set(sourceRow, used);

    entries.push({
      sourceRow,
      variantIndex,
      productName,
      price: cellPlainValue(siteRow.getCell(priceCol).value),
      weight: weightCol
        ? String(cellPlainValue(siteRow.getCell(weightCol).value) ?? '').trim()
        : ''
    });
    maxVariantIndex = Math.max(maxVariantIndex, variantIndex);
    maxSourceRow = Math.max(maxSourceRow, sourceRow);
  });

  ensureWholesaleHeaders(priceSheet);

  // Clear stale retail values/formulas first, while preserving styles and wholesale F/G.
  const maxPriceRow = Math.max(priceSheet.rowCount, maxSourceRow);
  for (let rowNumber = 2; rowNumber <= maxPriceRow; rowNumber++) {
    const row = priceSheet.getRow(rowNumber);
    clearLegacyReservedWholesaleCells(row);
    clearPriceRowRetailSlots(row, { clearWholesale: false, maxCol: 20 });
  }

  for (const entry of entries) {
    const row = priceSheet.getRow(entry.sourceRow);
    const target = priceSheetVariantCols(entry.variantIndex);
    if (!target) continue;
    if (entry.productName) row.getCell(1).value = entry.productName;
    row.getCell(target.priceCol).value = priceSheetStaticValueFromSitePrice(entry.price);
    row.getCell(target.weightCol).value = entry.weight || null;
  }

  stripPriceSheetExtraColumns(priceSheet);

  return {
    ok: true as const,
    updated: entries.length,
    skipped,
    clearedRows: Math.max(0, maxPriceRow - 1),
    maxRetailVariants: Math.min(maxVariantIndex, PRICE_SHEET_MAX_RETAIL_VARIANTS),
    lastCol: PRICE_SHEET_LAST_COL
  };
}
