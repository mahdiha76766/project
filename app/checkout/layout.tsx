import { redirect } from 'next/navigation';
import { getSalesConfig } from '@/lib/commerce/sales';

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const sales = await getSalesConfig();
  if (!sales.salesEnabled) redirect('/products');
  return children;
}
