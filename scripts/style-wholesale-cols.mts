/**
 * Fix F/G styles: F←D (price), G←E (weight), header F/G white.
 * Usage: npx tsx scripts/style-wholesale-cols.mts [path]
 */
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import {
  WHOLESALE_PRICE_COL,
  WHOLESALE_QTY_COL,
  WHOLESALE_PRICE_STYLE_SRC_COL as D,
  WHOLESALE_QTY_STYLE_SRC_COL as E,
  ensureWholesaleHeaders,
  copyCellStyleExact
} from '../lib/admin/product-excel-price-layout';

const FILE = process.argv[2] || path.join('uploads', 'products.xlsx');

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const ws = wb.getWorksheet('قیمت') || wb.getWorksheet('قیمت ها');
if (!ws) {
  console.error('قیمت sheet missing');
  process.exit(1);
}

ensureWholesaleHeaders(ws);

let donorPrice: ExcelJS.Cell | null = null;
let donorQty: ExcelJS.Cell | null = null;
const last = ws.rowCount || 1;
for (let r = 2; r <= Math.min(last, 100); r++) {
  const row = ws.getRow(r);
  const dFill = row.getCell(D).fill as ExcelJS.FillPattern | undefined;
  const eFill = row.getCell(E).fill as ExcelJS.FillPattern | undefined;
  const bFill = row.getCell(2).fill as ExcelJS.FillPattern | undefined;
  const cFill = row.getCell(3).fill as ExcelJS.FillPattern | undefined;
  if (!donorPrice && dFill?.pattern === 'solid' && dFill.fgColor) donorPrice = row.getCell(D);
  if (!donorPrice && bFill?.pattern === 'solid' && bFill.fgColor) donorPrice = row.getCell(2);
  if (!donorQty && eFill?.pattern === 'solid' && eFill.fgColor) donorQty = row.getCell(E);
  if (!donorQty && cFill?.pattern === 'solid' && cFill.fgColor) donorQty = row.getCell(3);
  if (donorPrice && donorQty) break;
}

let styled = 0;
for (let r = 2; r <= last; r++) {
  const row = ws.getRow(r);
  const name = String(row.getCell(1).value ?? '').trim();
  if (!name) continue;

  const dCell = row.getCell(D);
  const eCell = row.getCell(E);
  const dFill = dCell.fill as ExcelJS.FillPattern | undefined;
  const eFill = eCell.fill as ExcelJS.FillPattern | undefined;

  const priceSrc =
    dFill?.pattern === 'solid' && dFill.fgColor ? dCell : donorPrice || row.getCell(2);
  const qtySrc = eFill?.pattern === 'solid' && eFill.fgColor ? eCell : donorQty || row.getCell(3);

  copyCellStyleExact(priceSrc, row.getCell(WHOLESALE_PRICE_COL));
  copyCellStyleExact(qtySrc, row.getCell(WHOLESALE_QTY_COL));
  styled++;
}

const outTmp = FILE.replace(/\.xlsx$/i, `.styled-tmp-${Date.now()}.xlsx`);
await wb.xlsx.writeFile(outTmp);

let appliedTo = outTmp;
try {
  fs.copyFileSync(outTmp, FILE);
  appliedTo = FILE;
  fs.unlinkSync(outTmp);
} catch {
  console.warn('products.xlsx is locked (close Excel). Styled file saved as:', outTmp);
}

const wb2 = new ExcelJS.Workbook();
await wb2.xlsx.readFile(appliedTo);
const ws2 = wb2.getWorksheet('قیمت')!;
const hF = ws2.getRow(1).getCell(6).fill as ExcelJS.FillPattern;
const d = ws2.getRow(2).getCell(4).fill as ExcelJS.FillPattern;
const f = ws2.getRow(2).getCell(6).fill as ExcelJS.FillPattern;
const e = ws2.getRow(2).getCell(5).fill as ExcelJS.FillPattern;
const g = ws2.getRow(2).getCell(7).fill as ExcelJS.FillPattern;
console.log(
  JSON.stringify(
    {
      styled,
      appliedTo,
      headerFWhite: hF?.fgColor?.argb === 'FFFFFFFF',
      headerF: hF?.fgColor,
      matchDF: JSON.stringify(d?.fgColor) === JSON.stringify(f?.fgColor),
      matchEG: JSON.stringify(e?.fgColor) === JSON.stringify(g?.fgColor),
      d: d?.fgColor,
      f: f?.fgColor,
      e: e?.fgColor,
      g: g?.fgColor
    },
    null,
    2
  )
);
