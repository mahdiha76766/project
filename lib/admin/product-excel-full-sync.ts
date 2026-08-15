import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { Category, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  PRODUCTS_EXCEL_FILENAME,
  PRODUCTS_EXCEL_SHEET,
  resolveProductsExcelPath,
  syncProductsFromExcel
} from '@/lib/admin/product-excel-import';
import { LEGACY_PRICES_SHEET } from '@/lib/admin/product-excel-append';
import {
  WHOLESALE_PRICE_COL,
  WHOLESALE_QTY_COL,
  PRICE_SHEET_LAST_COL,
  PRICE_SHEET_MAX_RETAIL_VARIANTS,
  priceLookupFormula,
  priceSheetVariantCols
} from '@/lib/admin/product-excel-price-layout';
import {
  readProductsExcelWorkbook,
  withProductsExcelLock,
  writeProductsExcelWorkbook
} from '@/lib/admin/product-excel-io';
import {
  buildBaseProductSlug,
  buildVariantProductSlug,
  formatNewProductId,
  nextMongoProductSeq
} from '@/lib/admin/product-codes';
import { comparePersianNames } from '@/lib/admin/persian-sort';
import { getProductVariants } from '@/lib/product/variants';
import { coercePriceToman } from '@/lib/shop/price-currency';
import { stockToStatusLabel } from '@/lib/shop/stock-status';
import {
  computeWholesalePrice,
  normalizeWholesaleAmount,
  normalizeWholesaleDirection,
  normalizeWholesaleMode,
  normalizeWholesalePercent
} from '@/lib/price-portal/wholesale';
import { computeSitePrice, normalizeSitePercent } from '@/lib/price-portal/site-price';
import { parseVariantSizeAmount } from '@/lib/price-portal/variant-size';
import { getUploadsRoot } from '@/lib/admin/upload-storage';

/** فایل مرجع (فقط برای بازیابی اضطراری) */
export const CANONICAL_PRODUCTS_EXCEL = 'products_upload_20260728_103435.xlsx';

type StyleBag = Partial<ExcelJS.Style>;

type PortalVariantRow = {
  productId: string;
  weight: string;
  slug: string;
  priceToman: number;
  hasSitePrice: boolean;
  sitePercent: number | null;
  priceSite: number;
  stockStatus: string;
  status: string;
};

type PortalProductRow = {
  mongoId: string;
  name: string;
  baseSlug: string;
  categoryName: string;
  variants: PortalVariantRow[];
  hasWholesale: boolean;
  wholesalePriceToman: number | null;
  wholesaleQty: string;
};

function resolveCanonicalExcelPath() {
  return path.join(getUploadsRoot(), CANONICAL_PRODUCTS_EXCEL);
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

function snapshotCellStyle(cell: ExcelJS.Cell): StyleBag {
  const next: StyleBag = {};
  if (cell.font) next.font = { ...cell.font };
  if (cell.fill) next.fill = JSON.parse(JSON.stringify(cell.fill));
  if (cell.border) next.border = JSON.parse(JSON.stringify(cell.border));
  if (cell.alignment) next.alignment = { ...cell.alignment };
  if (cell.protection) next.protection = { ...cell.protection };
  if (cell.numFmt) next.numFmt = cell.numFmt;
  return next;
}

function applyStyleBag(cell: ExcelJS.Cell, bag: StyleBag | undefined) {
  if (!bag || !Object.keys(bag).length) return;
  const next: Partial<ExcelJS.Style> = { ...(cell.style || {}) };
  if (bag.font) next.font = { ...bag.font };
  if (bag.fill) next.fill = JSON.parse(JSON.stringify(bag.fill));
  if (bag.border) next.border = JSON.parse(JSON.stringify(bag.border));
  if (bag.alignment) next.alignment = { ...bag.alignment };
  if (bag.protection) next.protection = { ...bag.protection };
  if (bag.numFmt) next.numFmt = bag.numFmt;
  cell.style = next as ExcelJS.Style;
}

function clearCellValueOnly(cell: ExcelJS.Cell) {
  cell.value = null;
}

function isJunkWeightLabel(label: string) {
  const t = String(label || '')
    .trim()
    .replace(/\u200c/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
  if (!t) return true;
  if (t === 'پیش‌فرض' || t === 'پیشفرض' || t === 'default') return true;
  if (/^\d{1,4}$/.test(t)) return true;
  // ۱۰۰گرم / ۲۰۰گرم و مشابه — نباید در شیت قیمت باشند
  if (/^(50|100|150|200|250|300|400|500)(گرم|gr|g)$/i.test(t)) return true;
  if (/^\d{2,4}گرم$/.test(t)) return true;
  return false;
}

function variantWeightLabel(v: {
  name?: string;
  containerSize?: string;
  weight?: number;
  weightUnit?: string;
}) {
  const container = String(v.containerSize || '').trim();
  if (container && !isJunkWeightLabel(container)) return container;
  if (v.weight != null && Number.isFinite(Number(v.weight))) {
    const unit = String(v.weightUnit || '').trim();
    const label = unit ? `${v.weight} ${unit}` : String(v.weight);
    if (!isJunkWeightLabel(label)) return label;
  }
  const name = String(v.name || '').trim();
  if (name && !isJunkWeightLabel(name)) return name;
  return '';
}

function readPortalFields(source: {
  price?: number;
  portalPrice?: number;
  hasSitePrice?: boolean;
  sitePercent?: number | null;
  hasWholesale?: boolean;
  wholesaleDirection?: string;
  wholesaleMode?: string;
  wholesalePercent?: number | null;
  wholesaleAmount?: number | null;
  wholesaleQty?: string;
}) {
  const portalPrice = coercePriceToman(
    typeof source.portalPrice === 'number' ? source.portalPrice : source.price
  );
  const hasSitePrice = Boolean(source.hasSitePrice);
  const sitePercent = hasSitePrice ? normalizeSitePercent(source.sitePercent) : null;
  const priceSite =
    hasSitePrice && sitePercent ? computeSitePrice(portalPrice, sitePercent) : portalPrice;

  const hasWholesale = Boolean(source.hasWholesale);
  const wholesaleDirection = normalizeWholesaleDirection(source.wholesaleDirection);
  const wholesaleMode = normalizeWholesaleMode(source.wholesaleMode);
  const wholesalePercent =
    hasWholesale && wholesaleMode === 'percent'
      ? normalizeWholesalePercent(source.wholesalePercent)
      : null;
  const wholesaleAmount =
    hasWholesale && wholesaleMode === 'amount'
      ? normalizeWholesaleAmount(source.wholesaleAmount)
      : null;
  const wholesaleQty = hasWholesale ? String(source.wholesaleQty || '').trim() : '';
  const wholesalePriceToman =
    hasWholesale &&
    ((wholesaleMode === 'percent' && wholesalePercent) ||
      (wholesaleMode === 'amount' && wholesaleAmount != null))
      ? computeWholesalePrice(portalPrice, {
          direction: wholesaleDirection,
          mode: wholesaleMode,
          percent: wholesalePercent,
          amount: wholesaleAmount
        })
      : null;

  return {
    portalPrice,
    hasSitePrice,
    sitePercent,
    priceSite,
    hasWholesale,
    wholesaleQty,
    wholesalePriceToman
  };
}

function findPriceStyleDonor(priceSheet: ExcelJS.Worksheet) {
  const last = Math.max(priceSheet.rowCount || 2, 2);
  for (let r = 2; r <= Math.min(last, 200); r++) {
    const name = String(cellPlainValue(priceSheet.getRow(r).getCell(1).value) ?? '').trim();
    if (name && name !== 'نام محصولات') return r;
  }
  return 2;
}

function findSiteStyleDonor(
  siteSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> }
) {
  const nameCol = layout.colMap['نام محصول'];
  const last = Math.max(siteSheet.rowCount || layout.headerRow + 1, layout.headerRow + 1);
  for (let r = layout.headerRow + 1; r <= Math.min(last, 500); r++) {
    const name = nameCol
      ? String(cellPlainValue(siteSheet.getRow(r).getCell(nameCol).value) ?? '').trim()
      : '';
    if (name) return r;
  }
  return layout.headerRow + 1;
}

function snapshotPriceColumnStyles(priceSheet: ExcelJS.Worksheet, donorRow: number) {
  const row = priceSheet.getRow(donorRow);
  const styles: Record<number, StyleBag> = {};
  for (let c = 1; c <= PRICE_SHEET_LAST_COL; c++) {
    styles[c] = snapshotCellStyle(row.getCell(c));
  }
  return styles;
}

function snapshotSiteColumnStyles(
  siteSheet: ExcelJS.Worksheet,
  layout: { headerRow: number; colMap: Record<string, number> },
  donorRow: number
) {
  const row = siteSheet.getRow(donorRow);
  const styles: Record<number, StyleBag> = {};
  for (const col of new Set(Object.values(layout.colMap))) {
    styles[col] = snapshotCellStyle(row.getCell(col));
  }
  return styles;
}

function setSiteCell(
  row: ExcelJS.Row,
  colMap: Record<string, number>,
  label: string,
  value: ExcelJS.CellValue,
  styles: Record<number, StyleBag>,
  isNewRow: boolean
) {
  const col = colMap[label];
  if (col == null) return;
  const cell = row.getCell(col);
  if (isNewRow) applyStyleBag(cell, styles[col]);
  cell.value = value;
}

function chunkVariantsForPriceSheet<T>(variants: T[], size = PRICE_SHEET_MAX_RETAIL_VARIANTS): T[][] {
  const chunkSize = Math.max(1, size);
  if (!variants.length) return [[]];
  const chunks: T[][] = [];
  for (let i = 0; i < variants.length; i += chunkSize) {
    chunks.push(variants.slice(i, i + chunkSize));
  }
  return chunks;
}

async function buildPortalSnapshotFromDb(): Promise<{
  products: PortalProductRow[];
  skuPatches: Array<{ mongoId: string; variants: Array<{ index: number; sku: string }> }>;
}> {
  await connectToDatabase();

  const rawProducts = (await Product.find({})
    .select(
      'name slug sku price portalPrice hasSitePrice sitePercent hasWholesale wholesaleDirection wholesaleMode wholesalePercent wholesaleAmount wholesaleQty stock isActive category attributes variants'
    )
    .lean()) as Array<Record<string, unknown>>;

  const categoryIds = [
    ...new Set(
      rawProducts
        .map((p) => String(p.category || ''))
        .filter((id) => id && id !== 'undefined')
    )
  ];
  const categories = categoryIds.length
    ? ((await Category.find({ _id: { $in: categoryIds } })
        .select('name')
        .lean()) as Array<{ _id: unknown; name?: string }>)
    : [];
  const categoryNameById = new Map(
    categories.map((c) => [String(c._id), String(c.name || '').trim()])
  );

  let nextSeq = await nextMongoProductSeq();
  const usedSkus = new Set<string>();
  const skuPatches: Array<{ mongoId: string; variants: Array<{ index: number; sku: string }> }> =
    [];
  const products: PortalProductRow[] = [];

  for (const raw of rawProducts) {
    const mongoId = String(raw._id);
    const name = String(raw.name || '').trim();
    if (!name) continue;

    const productSlug = String(raw.slug || '').trim();
    const excelSlug = String(
      (raw.attributes as { excelSlug?: string } | undefined)?.excelSlug || productSlug
    )
      .trim()
      .replace(/-/g, '_');
    const baseSlug =
      excelSlug || buildBaseProductSlug(name, nextSeq) || `product_${mongoId.slice(-6)}`;
    const categoryName = categoryNameById.get(String(raw.category || '')) || '';
    const status = raw.isActive === false ? 'غیرفعال' : 'فعال';

    const variantsRaw = getProductVariants(raw as never).filter((v) => {
      const label = variantWeightLabel(v);
      // واریانت بدون وزن معتبر را نگه دار اگر قیمت دارد (تک‌واریانت کیلو خالی)
      if (!label) return true;
      return !isJunkWeightLabel(label);
    });

    if (!variantsRaw.length) continue;

    const productPatch: Array<{ index: number; sku: string }> = [];
    const variants: PortalVariantRow[] = [];
    let productSeq = 0;

    for (let i = 0; i < variantsRaw.length; i++) {
      const v = variantsRaw[i];
      const fields = readPortalFields({
        price: Number(v.price ?? raw.price ?? 0),
        portalPrice:
          typeof v.portalPrice === 'number'
            ? v.portalPrice
            : typeof raw.portalPrice === 'number'
              ? (raw.portalPrice as number)
              : undefined,
        hasSitePrice:
          typeof v.hasSitePrice === 'boolean'
            ? v.hasSitePrice
            : (raw.hasSitePrice as boolean | undefined),
        sitePercent:
          typeof v.sitePercent === 'number'
            ? v.sitePercent
            : (raw.sitePercent as number | undefined),
        hasWholesale:
          typeof v.hasWholesale === 'boolean'
            ? v.hasWholesale
            : (raw.hasWholesale as boolean | undefined),
        wholesaleDirection:
          (v.wholesaleDirection as string | undefined) ||
          (raw.wholesaleDirection as string | undefined),
        wholesaleMode:
          (v.wholesaleMode as string | undefined) || (raw.wholesaleMode as string | undefined),
        wholesalePercent:
          typeof v.wholesalePercent === 'number'
            ? v.wholesalePercent
            : (raw.wholesalePercent as number | undefined),
        wholesaleAmount:
          typeof v.wholesaleAmount === 'number'
            ? v.wholesaleAmount
            : (raw.wholesaleAmount as number | undefined),
        wholesaleQty:
          (v.wholesaleQty as string | undefined) || (raw.wholesaleQty as string | undefined)
      });

      let sku = String(v.sku || (i === 0 ? raw.sku : '') || '').trim();
      const looksStable = /^ns-/i.test(sku);
      if (!sku || !looksStable || usedSkus.has(sku.toLowerCase())) {
        if (!productSeq) {
          productSeq = nextSeq;
          nextSeq += 1;
        }
        sku = formatNewProductId(productSeq, i + 1);
        while (usedSkus.has(sku.toLowerCase())) {
          productSeq = nextSeq;
          nextSeq += 1;
          sku = formatNewProductId(productSeq, i + 1);
        }
        productPatch.push({ index: i, sku });
      }
      usedSkus.add(sku.toLowerCase());

      const weight = variantWeightLabel(v);
      const slug =
        variantsRaw.length <= 1
          ? baseSlug
          : buildVariantProductSlug(baseSlug, weight, i + 1);

      variants.push({
        productId: sku,
        weight,
        slug,
        priceToman: fields.portalPrice,
        hasSitePrice: fields.hasSitePrice,
        sitePercent: fields.sitePercent,
        priceSite: fields.priceSite,
        stockStatus: stockToStatusLabel(v.stock ?? raw.stock),
        status
      });
    }

    variants.sort((a, b) => {
      const sa = parseVariantSizeAmount(a.weight);
      const sb = parseVariantSizeAmount(b.weight);
      if (sa != null && sb != null && sa !== sb) return sa - sb;
      if (sa != null && sb == null) return -1;
      if (sa == null && sb != null) return 1;
      return comparePersianNames(a.weight, b.weight);
    });

    const wholesaleSource =
      variantsRaw.find((v) => v.hasWholesale) ||
      (raw.hasWholesale ? raw : null) ||
      variantsRaw[0] ||
      raw;
    const wholesale = readPortalFields({
      price: Number(
        (wholesaleSource as { price?: number }).price ?? raw.price ?? variants[0].priceToman
      ),
      portalPrice:
        typeof (wholesaleSource as { portalPrice?: number }).portalPrice === 'number'
          ? (wholesaleSource as { portalPrice?: number }).portalPrice
          : variants[0].priceToman,
      hasWholesale:
        typeof (wholesaleSource as { hasWholesale?: boolean }).hasWholesale === 'boolean'
          ? (wholesaleSource as { hasWholesale?: boolean }).hasWholesale
          : Boolean(raw.hasWholesale),
      wholesaleDirection:
        (wholesaleSource as { wholesaleDirection?: string }).wholesaleDirection ||
        (raw.wholesaleDirection as string | undefined),
      wholesaleMode:
        (wholesaleSource as { wholesaleMode?: string }).wholesaleMode ||
        (raw.wholesaleMode as string | undefined),
      wholesalePercent:
        (wholesaleSource as { wholesalePercent?: number }).wholesalePercent ??
        (raw.wholesalePercent as number | undefined),
      wholesaleAmount:
        (wholesaleSource as { wholesaleAmount?: number }).wholesaleAmount ??
        (raw.wholesaleAmount as number | undefined),
      wholesaleQty:
        (wholesaleSource as { wholesaleQty?: string }).wholesaleQty ||
        (raw.wholesaleQty as string | undefined)
    });

    if (productPatch.length) skuPatches.push({ mongoId, variants: productPatch });

    products.push({
      mongoId,
      name,
      baseSlug,
      categoryName,
      variants,
      hasWholesale: wholesale.hasWholesale,
      wholesalePriceToman: wholesale.wholesalePriceToman,
      wholesaleQty: wholesale.wholesaleQty
    });
  }

  products.sort((a, b) => comparePersianNames(a.name, b.name));
  return { products, skuPatches };
}

async function applySkuPatches(
  skuPatches: Array<{ mongoId: string; variants: Array<{ index: number; sku: string }> }>
) {
  if (!skuPatches.length) return;
  await connectToDatabase();
  for (const patch of skuPatches) {
    const product = await Product.findById(patch.mongoId);
    if (!product) continue;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    let changed = false;
    for (const item of patch.variants) {
      if (variants[item.index]) {
        variants[item.index].sku = item.sku;
        changed = true;
        if (item.index === 0) product.sku = item.sku;
      } else if (item.index === 0 && !variants.length) {
        product.sku = item.sku;
        changed = true;
      }
    }
    if (changed) {
      product.markModified('variants');
      await product.save();
    }
  }
}

async function rewriteExcelFromPortalSnapshot(
  products: PortalProductRow[],
  filePath: string
) {
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
  if (!siteSheet) return { ok: false as const, reason: 'site_prices_missing' as const };

  const priceSheet =
    workbook.getWorksheet(LEGACY_PRICES_SHEET) ||
    workbook.getWorksheet('قیمت ها') ||
    workbook.getWorksheet('قیمت‌ها');
  if (!priceSheet) return { ok: false as const, reason: 'prices_sheet_missing' as const };

  const layout = parseSitePricesLayout(siteSheet);
  if (!layout) return { ok: false as const, reason: 'site_prices_layout_invalid' as const };

  const priceDonorRow = findPriceStyleDonor(priceSheet);
  const siteDonorRow = findSiteStyleDonor(siteSheet, layout);
  const priceStyles = snapshotPriceColumnStyles(priceSheet, priceDonorRow);
  const siteStyles = snapshotSiteColumnStyles(siteSheet, layout, siteDonorRow);
  const priceRowHeight = priceSheet.getRow(priceDonorRow).height;
  const siteRowHeight = siteSheet.getRow(siteDonorRow).height;

  const oldPriceLast = Math.max(priceSheet.rowCount || 1, priceSheet.actualRowCount || 1, 1);
  const oldSiteLast = Math.max(siteSheet.rowCount || 1, siteSheet.actualRowCount || 1, 1);

  for (let r = 2; r <= oldPriceLast; r++) {
    const row = priceSheet.getRow(r);
    for (let c = 1; c <= Math.max(PRICE_SHEET_LAST_COL, 12); c++) {
      clearCellValueOnly(row.getCell(c));
    }
    row.commit();
  }

  for (let r = layout.headerRow + 1; r <= oldSiteLast; r++) {
    const row = siteSheet.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => clearCellValueOnly(cell));
    row.commit();
  }

  const col = layout.colMap;
  let siteWriteRow = layout.headerRow + 1;
  let priceWriteRow = 2;
  const sourceRowByMongoId = new Map<string, number>();
  let siteRowsWritten = 0;
  let priceRowsWritten = 0;

  for (const product of products) {
    const variantChunks = chunkVariantsForPriceSheet(product.variants);

    variantChunks.forEach((chunk, chunkIndex) => {
      const sourceRow = priceWriteRow;
      if (chunkIndex === 0) sourceRowByMongoId.set(product.mongoId, sourceRow);

      const priceRow = priceSheet.getRow(sourceRow);
      const priceIsNew = sourceRow > oldPriceLast;
      if (priceIsNew && priceRowHeight != null) priceRow.height = priceRowHeight;
      if (priceIsNew) {
        for (let c = 1; c <= PRICE_SHEET_LAST_COL; c++) {
          applyStyleBag(priceRow.getCell(c), priceStyles[c]);
        }
      }

      priceRow.getCell(1).value = product.name;

      for (let i = 0; i < chunk.length; i++) {
        const cols = priceSheetVariantCols(i + 1);
        if (!cols) continue;
        const v = chunk[i];
        const displayPrice = Math.round(Math.max(0, Number(v.priceToman) || 0) / 1000);
        priceRow.getCell(cols.priceCol).value = {
          formula: priceLookupFormula(v.productId),
          result: displayPrice
        };
        priceRow.getCell(cols.weightCol).value = v.weight || null;
      }

      for (let i = chunk.length; i < PRICE_SHEET_MAX_RETAIL_VARIANTS; i++) {
        const cols = priceSheetVariantCols(i + 1);
        if (!cols) continue;
        priceRow.getCell(cols.priceCol).value = null;
        priceRow.getCell(cols.weightCol).value = null;
      }

      const wholesalePriceCell = priceRow.getCell(WHOLESALE_PRICE_COL);
      const wholesaleQtyCell = priceRow.getCell(WHOLESALE_QTY_COL);
      if (priceIsNew) {
        applyStyleBag(wholesalePriceCell, priceStyles[WHOLESALE_PRICE_COL]);
        applyStyleBag(wholesaleQtyCell, priceStyles[WHOLESALE_QTY_COL]);
      }
      if (
        chunkIndex === 0 &&
        product.hasWholesale &&
        product.wholesalePriceToman != null &&
        Number(product.wholesalePriceToman) >= 0
      ) {
        wholesalePriceCell.value = Math.round(Number(product.wholesalePriceToman) / 1000);
        wholesaleQtyCell.value = product.wholesaleQty || null;
      } else {
        wholesalePriceCell.value = null;
        wholesaleQtyCell.value = null;
      }

      priceRow.commit();
      priceWriteRow += 1;
      priceRowsWritten += 1;

      for (const v of chunk) {
        const excelRow = siteSheet.getRow(siteWriteRow);
        const siteIsNew = siteWriteRow > oldSiteLast;
        if (siteIsNew && siteRowHeight != null) excelRow.height = siteRowHeight;

        setSiteCell(excelRow, col, 'product_id', v.productId, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'نام محصول', product.name, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'slug', v.slug, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'دسته‌بندی', product.categoryName, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'نوع/وزن', v.weight, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'واحد', v.weight, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'قیمت خام', v.priceToman, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'price_toman', v.priceToman, siteStyles, siteIsNew);
        setSiteCell(
          excelRow,
          col,
          'درصد',
          v.hasSitePrice ? v.sitePercent ?? '' : '',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'precent',
          v.hasSitePrice ? v.sitePercent ?? '' : '',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'percent',
          v.hasSitePrice ? v.sitePercent ?? '' : '',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'قیمت سایت',
          v.hasSitePrice ? v.priceSite : '',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'price_site',
          v.hasSitePrice ? v.priceSite : '',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'قیمت سایت جداگانه',
          v.hasSitePrice ? 'بله' : 'خیر',
          siteStyles,
          siteIsNew
        );
        setSiteCell(
          excelRow,
          col,
          'has_site_price',
          v.hasSitePrice ? 'بله' : 'خیر',
          siteStyles,
          siteIsNew
        );
        setSiteCell(excelRow, col, 'وضعیت', v.status, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'stock_status', v.stockStatus, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'source_row', sourceRow, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'site_key', v.productId, siteStyles, siteIsNew);
        setSiteCell(excelRow, col, 'price_lookup_key', v.productId, siteStyles, siteIsNew);

        excelRow.commit();
        siteWriteRow += 1;
        siteRowsWritten += 1;
      }
    });
  }

  await writeProductsExcelWorkbook(workbook, filePath);

  return {
    ok: true as const,
    products: products.length,
    siteRowsWritten,
    priceRowsWritten,
    sourceRowByMongoId,
    filePath
  };
}

async function persistSourceRows(sourceRowByMongoId: Map<string, number>) {
  if (!sourceRowByMongoId.size) return;
  await connectToDatabase();
  const ops: Array<{
    updateOne: {
      filter: Record<string, unknown>;
      update: { $set: { 'attributes.sourceRow': number } };
    };
  }> = [];

  for (const [id, sourceRow] of sourceRowByMongoId.entries()) {
    ops.push({
      updateOne: {
        filter: { _id: id },
        update: { $set: { 'attributes.sourceRow': sourceRow } }
      }
    });
    if (
      mongoose.Types.ObjectId.isValid(id) &&
      String(new mongoose.Types.ObjectId(id)) === id
    ) {
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { 'attributes.sourceRow': sourceRow } }
        }
      });
    }
  }

  if (ops.length) {
    await Product.collection.bulkWrite(ops as never[], { ordered: false });
  }
}

/**
 * اکسل = تصویر فعلی پورتال قیمت (Mongo).
 * روی هر ذخیره/ایجاد/حذف پورتال صدا زده می‌شود — نیازی به remirror دستی نیست.
 */
export async function syncAllPortalProductsToExcel(
  filePath = resolveProductsExcelPath()
) {
  const { products, skuPatches } = await buildPortalSnapshotFromDb();
  await applySkuPatches(skuPatches);

  const result = await withProductsExcelLock(() =>
    rewriteExcelFromPortalSnapshot(products, filePath)
  );

  if (!result.ok) return result;

  try {
    await persistSourceRows(result.sourceRowByMongoId);
  } catch (error) {
    console.warn('[excel][full-sync] sourceRow persist failed', error);
  }

  console.info('[excel][full-sync] rewritten from portal', {
    filePath: result.filePath,
    products: result.products,
    siteRows: result.siteRowsWritten,
    priceRows: result.priceRowsWritten
  });

  return {
    ok: true as const,
    matched: true as const,
    updated: true as const,
    products: result.products,
    siteRowsWritten: result.siteRowsWritten,
    priceRowsWritten: result.priceRowsWritten,
    filePath: result.filePath
  };
}

/**
 * بازیابی اضطراری از فایل مرجع (اختیاری) — معمولاً لازم نیست؛
 * ذخیره پورتال خودش اکسل را بازنویسی می‌کند.
 */
export async function restoreProductsExcelFromCanonical(options?: {
  canonicalPath?: string;
  targetPath?: string;
  dryRun?: boolean;
}) {
  const canonicalPath = options?.canonicalPath || resolveCanonicalExcelPath();
  const targetPath = options?.targetPath || resolveProductsExcelPath();

  try {
    await fs.access(canonicalPath);
  } catch {
    return {
      ok: false as const,
      reason: 'canonical_missing' as const,
      canonicalPath,
      targetPath
    };
  }

  if (!options?.dryRun) {
    await withProductsExcelLock(async () => {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      try {
        await fs.access(targetPath);
        await fs.copyFile(targetPath, `${targetPath}.pre-canonical-restore.bak`);
      } catch {
        // ignore
      }
      await fs.copyFile(canonicalPath, targetPath);
    });
  }

  const imported = await syncProductsFromExcel({
    filePath: targetPath,
    dryRun: options?.dryRun,
    replaceVariants: true,
    updateNames: true
  });

  // بعد از import، یک‌بار از Mongo به اکسل بنویس تا شیت قیمت هم تمیز باشد
  if (!options?.dryRun) {
    await syncAllPortalProductsToExcel(targetPath);
  }

  return {
    ok: true as const,
    canonicalPath,
    targetPath,
    imported
  };
}

export function getCanonicalProductsExcelPath() {
  return resolveCanonicalExcelPath();
}

export function getLiveProductsExcelPath() {
  return resolveProductsExcelPath();
}

export { PRODUCTS_EXCEL_FILENAME, CANONICAL_PRODUCTS_EXCEL as CANONICAL_FILENAME };
