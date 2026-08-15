import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';

/** حداقل اندازهٔ معقول برای یک .xlsx سالم (ZIP header + محتوا) */
const MIN_XLSX_BYTES = 64;
const LOCK_STALE_MS = 90_000;
const LOCK_WAIT_MS = 45_000;

let excelQueue: Promise<unknown> = Promise.resolve();

function isZipBuffer(buf: Buffer) {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b;
}

/**
 * ExcelJS نمی‌تواند shared formulaهایی را بنویسد که بعد از سورت/جابه‌جایی
 * master پایین‌تر یا راست‌تر از clone قرار گرفته باشد.
 * قبل از هر write، همه را به فرمول مستقل (یا مقدار ثابت) تبدیل می‌کنیم.
 */
export function materializeSharedFormulasInSheet(sheet: ExcelJS.Worksheet) {
  sheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value;
      if (!value || typeof value !== 'object') return;

      const asFormula = value as ExcelJS.CellFormulaValue & {
        shareType?: string;
        ref?: string;
        sharedFormula?: string;
      };

      // کلون shared: { sharedFormula: 'J10', result }
      if ('sharedFormula' in asFormula && asFormula.sharedFormula) {
        const formula = String(cell.formula || asFormula.formula || '').trim();
        const result = asFormula.result;
        if (formula) {
          cell.value =
            result !== undefined && result !== null
              ? { formula, result }
              : { formula };
        } else if (result !== undefined && result !== null) {
          cell.value = result as ExcelJS.CellValue;
        } else {
          cell.value = null;
        }
        return;
      }

      // مستر shared: { formula, shareType:'shared', ref:'J2:J500' }
      if ('formula' in asFormula && asFormula.shareType === 'shared') {
        const formula = String(asFormula.formula || cell.formula || '').trim();
        const result = asFormula.result;
        if (formula) {
          cell.value =
            result !== undefined && result !== null
              ? { formula, result }
              : { formula };
        } else if (result !== undefined && result !== null) {
          cell.value = result as ExcelJS.CellValue;
        }
      }
    });
  });
}

export function materializeSharedFormulasInWorkbook(workbook: ExcelJS.Workbook) {
  workbook.eachSheet((sheet) => {
    materializeSharedFormulasInSheet(sheet);
  });
}

/** آخرین راه‌حل: هر shared باقی‌مانده فقط به result تبدیل شود */
function forceFlattenSharedFormulas(workbook: ExcelJS.Workbook) {
  workbook.eachSheet((sheet) => {
    sheet.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value;
        if (!value || typeof value !== 'object') return;
        if ('sharedFormula' in value) {
          const result = (value as ExcelJS.CellSharedFormulaValue).result;
          cell.value =
            result !== undefined && result !== null ? (result as ExcelJS.CellValue) : null;
          return;
        }
        if ('formula' in value && (value as { shareType?: string }).shareType === 'shared') {
          const formula = String((value as ExcelJS.CellFormulaValue).formula || cell.formula || '');
          const result = (value as ExcelJS.CellFormulaValue).result;
          if (formula) {
            cell.value =
              result !== undefined && result !== null ? { formula, result } : { formula };
          } else {
            cell.value =
              result !== undefined && result !== null ? (result as ExcelJS.CellValue) : null;
          }
        }
      });
    });
  });
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function acquireFileLock(lockPath: string) {
  const started = Date.now();
  while (Date.now() - started < LOCK_WAIT_MS) {
    try {
      const handle = await fs.open(lockPath, 'wx');
      await handle.writeFile(`${process.pid}:${Date.now()}`, 'utf8');
      await handle.close();
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'EEXIST') throw error;
      try {
        const st = await fs.stat(lockPath);
        if (Date.now() - st.mtimeMs > LOCK_STALE_MS) {
          await fs.unlink(lockPath).catch(() => undefined);
          continue;
        }
      } catch {
        // قفل هم‌زمان برداشته شده
      }
      await sleep(40 + Math.floor(Math.random() * 80));
    }
  }
  throw new Error('قفل فایل اکسل آزاد نشد؛ چند لحظه دیگر دوباره تلاش کنید.');
}

async function releaseFileLock(lockPath: string) {
  await fs.unlink(lockPath).catch(() => undefined);
}

/**
 * همهٔ خواندن/نوشتن products.xlsx از این صف + قفل فایلی رد می‌شوند
 * تا دو درخواست (یا دو پروسه) همزمان فایل را truncate/corrupt نکنند.
 */
export function withProductsExcelLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = excelQueue.then(
    () => runWithFileLock(fn),
    () => runWithFileLock(fn)
  );
  excelQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function runWithFileLock<T>(fn: () => Promise<T>): Promise<T> {
  const { getUploadsRoot } = await import('@/lib/admin/upload-storage');
  const filePath = path.join(getUploadsRoot(), 'products.xlsx');
  const lockPath = `${filePath}.lock`;
  await acquireFileLock(lockPath);
  try {
    return await fn();
  } finally {
    await releaseFileLock(lockPath);
  }
}

export async function tryRestoreProductsExcel(filePath: string) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const candidates = [
    path.join(dir, `${base}.bak`),
    path.join(dir, 'products_fix.xlsx'),
    path.join(dir, 'products_fix.xlsx'),
    path.join(dir, 'product_fix.xlsx')
  ];

  for (const candidate of candidates) {
    try {
      const st = await fs.stat(candidate);
      if (!st.isFile() || st.size < MIN_XLSX_BYTES) continue;
      const buf = Buffer.alloc(4);
      const fh = await fs.open(candidate, 'r');
      try {
        await fh.read(buf, 0, 4, 0);
      } finally {
        await fh.close();
      }
      if (!isZipBuffer(buf)) continue;

      await fs.copyFile(candidate, filePath);
      console.warn('[excel] restored products.xlsx from', candidate);
      return { ok: true as const, from: candidate };
    } catch {
      // next candidate
    }
  }
  return { ok: false as const };
}

export async function assertProductsExcelReadable(filePath: string) {
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    const restored = await tryRestoreProductsExcel(filePath);
    if (restored.ok) {
      stat = await fs.stat(filePath);
    } else {
      const err = new Error('فایل اکسل products.xlsx یافت نشد');
      (err as Error & { code: string }).code = 'excel_file_missing';
      throw err;
    }
  }

  if (!stat.isFile() || stat.size < MIN_XLSX_BYTES) {
    const restored = await tryRestoreProductsExcel(filePath);
    if (restored.ok) {
      stat = await fs.stat(filePath);
    } else {
      const err = new Error(
        `فایل اکسل خراب یا خالی است (حجم: ${stat.size} بایت). از بکاپ بازیابی کنید یا products_fix.xlsx را جایگزین کنید.`
      );
      (err as Error & { code: string }).code = 'excel_corrupted';
      throw err;
    }
  }

  return stat;
}

/** خواندن امن workbook با اعتبارسنجی حجم + بازیابی خودکار */
export async function readProductsExcelWorkbook(filePath: string) {
  await assertProductsExcelReadable(filePath);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/corrupted zip|end of data reached|invalid zip/i.test(msg)) {
      const restored = await tryRestoreProductsExcel(filePath);
      if (restored.ok) {
        const retry = new ExcelJS.Workbook();
        await retry.xlsx.readFile(filePath);
        return retry;
      }
      const err = new Error(
        `فایل اکسل خراب شده است و قابل خواندن نیست. از بکاپ یا products_fix.xlsx بازیابی کنید. (${msg})`
      );
      (err as Error & { code: string }).code = 'excel_corrupted';
      throw err;
    }
    throw error;
  }
  return workbook;
}

/**
 * نوشتن اتمی: بافر کامل → فایل موقت → جابه‌جایی.
 * هرگز مستقیم روی products.xlsx truncate نمی‌کند.
 */
export async function writeProductsExcelWorkbook(workbook: ExcelJS.Workbook, filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpPath = path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);
  const bakPath = path.join(dir, `${base}.bak`);
  const oldPath = path.join(dir, `.${base}.${process.pid}.${Date.now()}.old`);

  try {
    // جلوگیری از خطای Shared Formula master must exist above...
    materializeSharedFormulasInWorkbook(workbook);

    let buffer: Buffer;
    try {
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    } catch (writeError) {
      const msg = writeError instanceof Error ? writeError.message : String(writeError);
      if (!/shared formula/i.test(msg)) throw writeError;
      console.warn('[excel] shared-formula write failed; flattening and retrying', { msg });
      forceFlattenSharedFormulas(workbook);
      buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    }

    if (buffer.length < MIN_XLSX_BYTES || !isZipBuffer(buffer)) {
      throw new Error(`نوشتن اکسل ناموفق بود (بافر نامعتبر: ${buffer.length} بایت)`);
    }

    await fs.writeFile(tmpPath, buffer);
    const tmpStat = await fs.stat(tmpPath);
    if (tmpStat.size !== buffer.length) {
      throw new Error('نوشتن فایل موقت اکسل ناقص بود');
    }

    let hadPrevious = false;
    try {
      const prev = await fs.stat(filePath);
      if (prev.size >= MIN_XLSX_BYTES) {
        await fs.copyFile(filePath, bakPath);
        hadPrevious = true;
      }
    } catch {
      // فایل قبلی نبود
    }

    if (hadPrevious) {
      await fs.rename(filePath, oldPath);
      try {
        await fs.rename(tmpPath, filePath);
        await fs.unlink(oldPath).catch(() => undefined);
      } catch (replaceError) {
        await fs.rename(oldPath, filePath).catch(() => undefined);
        throw replaceError;
      }
    } else {
      await fs.rename(tmpPath, filePath);
    }

    const finalStat = await fs.stat(filePath);
    if (finalStat.size < MIN_XLSX_BYTES) {
      const restored = await tryRestoreProductsExcel(filePath);
      if (!restored.ok) {
        throw new Error('پس از ذخیره، فایل اکسل خالی شد و بازیابی ممکن نبود');
      }
      throw new Error('پس از ذخیره، فایل اکسل خالی شد؛ از بکاپ بازیابی شد. دوباره ذخیره کنید.');
    }

    return finalStat;
  } catch (error) {
    await fs.unlink(tmpPath).catch(() => undefined);
    await fs.unlink(oldPath).catch(() => undefined);
    throw error;
  }
}
