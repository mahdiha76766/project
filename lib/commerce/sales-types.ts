export const SALES_CACHE_TAG = 'sales-config';

export type SalesConfig = {
  salesEnabled: boolean;
  showPricesWhenSalesDisabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export const defaultSalesConfig: SalesConfig = {
  salesEnabled: false,
  showPricesWhenSalesDisabled: false,
  updatedAt: null,
  updatedBy: null
};

export function normalizeSalesConfig(value: unknown): SalesConfig {
  if (!value || typeof value !== 'object') return defaultSalesConfig;
  const v = value as Partial<SalesConfig>;
  return {
    salesEnabled: v.salesEnabled === true,
    showPricesWhenSalesDisabled: v.showPricesWhenSalesDisabled === true,
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : null,
    updatedBy: typeof v.updatedBy === 'string' ? v.updatedBy : null
  };
}

export function shouldShowPrices(config: Pick<SalesConfig, 'salesEnabled' | 'showPricesWhenSalesDisabled'>) {
  return config.salesEnabled || config.showPricesWhenSalesDisabled;
}
