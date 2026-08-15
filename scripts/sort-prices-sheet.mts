/**
 * One-shot: alphabetically sort sheet «قیمت» and remap site_prices source_row keys.
 * Usage: npx tsx scripts/sort-prices-sheet.mts
 */
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { comparePersianNames } from '../lib/admin/persian-sort';

const FILE = process.argv[2] || path.join('uploads', 'products.xlsx');

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

function cloneCellValue(value: ExcelJS.CellValue): ExcelJS.CellValue {
  if (value == null) return null;
  if (typeof value !== 'object') return value;
  if ('formula' in value) {
    const result = value.result;
    return result !== undefined ? (result as ExcelJS.CellValue) : null;
  }
  if ('richText' in value && Array.isArray(value.richText)) {
    return { richText: value.richText.map((p) => ({ ...p })) };
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

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const priceSheet = wb.getWorksheet('قیمت') || wb.getWorksheet('قیمت ها');
const siteSheet = wb.getWorksheet('site_prices');
if (!priceSheet || !siteSheet) {
  console.error('missing sheets');
  process.exit(1);
}

let layout: { headerRow: number; colMap: Record<string, number> } | null = null;
for (let r = 1; r <= 6; r++) {
  const colMap = buildColMap(siteSheet.getRow(r));
  if (colMap.price_toman != null || colMap['نام محصول'] != null) {
    layout = { headerRow: r, colMap };
    break;
  }
}
if (!layout) {
  console.error('site_prices layout missing');
  process.exit(1);
}

type Snap = {
  oldRow: number;
  name: string;
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

const snapshots: Snap[] = [];
let sheetMaxCol = 7;
const lastRow = Math.max(priceSheet.rowCount || 1, priceSheet.actualRowCount || 1);

for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
  const row = priceSheet.getRow(rowNumber);
  const name =
    String(cellPlainValue(row.getCell(1).value) ?? '').trim() ||
    String(row.getCell(1).text || '').trim();
  if (!name || name === 'نام محصولات') continue;

  const cells: Snap['cells'] = [];
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (colNumber > sheetMaxCol) sheetMaxCol = colNumber;
    cells.push({
      col: colNumber,
      value: cloneCellValue(cell.value),
      font: cell.font ? { ...cell.font } : undefined,
      fill: cell.fill ? JSON.parse(JSON.stringify(cell.fill)) : undefined,
      border: cell.border ? JSON.parse(JSON.stringify(cell.border)) : undefined,
      alignment: cell.alignment ? { ...cell.alignment } : undefined,
      numFmt: cell.numFmt || undefined
    });
  });
  if (!cells.some((c) => c.col === 1)) cells.unshift({ col: 1, value: name });
  else {
    const nc = cells.find((c) => c.col === 1);
    if (nc) nc.value = name;
  }
  snapshots.push({ oldRow: rowNumber, name, height: row.height, cells });
}

snapshots.sort((a, b) => {
  const c = comparePersianNames(a.name, b.name);
  return c !== 0 ? c : a.oldRow - b.oldRow;
});

const startRow = 2;
const remapped = new Map<number, number>();
snapshots.forEach((s, i) => remapped.set(s.oldRow, startRow + i));

for (let r = startRow; r <= lastRow; r++) {
  const row = priceSheet.getRow(r);
  for (let c = 1; c <= sheetMaxCol; c++) row.getCell(c).value = null;
  row.commit();
}

for (let i = 0; i < snapshots.length; i++) {
  const snap = snapshots[i];
  const dest = priceSheet.getRow(startRow + i);
  if (snap.height != null) dest.height = snap.height;
  for (const cell of snap.cells) {
    const target = dest.getCell(cell.col);
    target.value = cell.value;
    if (cell.font) target.font = cell.font;
    if (cell.fill) target.fill = cell.fill;
    if (cell.border) target.border = cell.border;
    if (cell.alignment) target.alignment = cell.alignment;
    if (cell.numFmt) target.numFmt = cell.numFmt;
  }
  dest.getCell(1).value = snap.name;
  dest.commit();
}

const sourceCol = layout.colMap.source_row;
const lookupCol = layout.colMap.price_lookup_key;
if (sourceCol) {
  siteSheet.eachRow({ includeEmpty: false }, (excelRow, rowNumber) => {
    if (rowNumber <= layout!.headerRow) return;
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

const backup = FILE.replace(/\.xlsx$/i, `.pre-sort-${Date.now()}.xlsx`);
fs.copyFileSync(FILE, backup);
await wb.xlsx.writeFile(FILE);

const verify: string[] = [];
for (let r = 2; r <= Math.min(12, startRow + snapshots.length - 1); r++) {
  verify.push(`${r}:${String(priceSheet.getRow(r).getCell(1).value ?? '')}`);
}
console.log('sorted', snapshots.length, 'rows');
console.log('backup', backup);
console.log(verify.join('\n'));
