'use client';

import { createContext, useContext } from 'react';
import type { SalesConfig } from '@/lib/commerce/sales-types';
import { defaultSalesConfig, shouldShowPrices } from '@/lib/commerce/sales-types';

const SalesContext = createContext<SalesConfig>(defaultSalesConfig);

export function SalesProvider({ value, children }: { value: SalesConfig; children: React.ReactNode }) {
  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSalesConfig() {
  return useContext(SalesContext);
}

export function useShowPrices() {
  return shouldShowPrices(useSalesConfig());
}

export function CommerceOnly({ children }: { children: React.ReactNode }) {
  const { salesEnabled } = useSalesConfig();
  if (!salesEnabled) return null;
  return <>{children}</>;
}

export function CatalogOnly({ children }: { children: React.ReactNode }) {
  const { salesEnabled } = useSalesConfig();
  if (salesEnabled) return null;
  return <>{children}</>;
}

export function PriceOnly({ children }: { children: React.ReactNode }) {
  if (!useShowPrices()) return null;
  return <>{children}</>;
}
