/** نمایش و نگاشت وضعیت موجودی — فقط «موجود» / «ناموجود» (بدون عدد در UI). */

export const STOCK_STATUS_AVAILABLE = 'موجود' as const;
export const STOCK_STATUS_UNAVAILABLE = 'ناموجود' as const;

export type StockStatusLabel = typeof STOCK_STATUS_AVAILABLE | typeof STOCK_STATUS_UNAVAILABLE;

/** وقتی فقط تیک «موجود» زده می‌شود و عدد قبلی نداریم */
export const STOCK_AVAILABLE_DEFAULT_QTY = 999;

export function isInStock(stock: unknown): boolean {
  return Number(stock || 0) > 0;
}

export function stockToStatusLabel(stock: unknown): StockStatusLabel {
  return isInStock(stock) ? STOCK_STATUS_AVAILABLE : STOCK_STATUS_UNAVAILABLE;
}

export function parseStockStatusLabel(value: unknown): StockStatusLabel {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ');
  if (!raw) return STOCK_STATUS_UNAVAILABLE;
  if (
    raw === 'موجود' ||
    raw === 'yes' ||
    raw === 'true' ||
    raw === '1' ||
    raw === 'in stock' ||
    raw === 'available' ||
    raw.includes('موجود')
  ) {
    return STOCK_STATUS_AVAILABLE;
  }
  return STOCK_STATUS_UNAVAILABLE;
}

/** برای ذخیره در DB وقتی UI فقط موجود/ناموجود می‌دهد */
export function statusToStockNumber(available: boolean, previousStock = 0): number {
  if (!available) return 0;
  const prev = Math.max(0, Number(previousStock) || 0);
  return prev > 0 ? prev : STOCK_AVAILABLE_DEFAULT_QTY;
}

export function stockStatusFromExcelCell(value: unknown, fallbackStock?: unknown): StockStatusLabel {
  const text = String(value ?? '').trim();
  if (text) return parseStockStatusLabel(text);
  return stockToStatusLabel(fallbackStock);
}
