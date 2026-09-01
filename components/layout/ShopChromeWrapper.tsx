import { ShopChrome } from '@/components/layout/ShopChrome';
import { SalesProvider } from '@/components/commerce/SalesProvider';
import { getSitePageContent } from '@/lib/admin/page-content';
import { getSalesConfig } from '@/lib/commerce/sales';

export async function ShopChromeWrapper({ children }: { children: React.ReactNode }) {
  const [initialContent, sales] = await Promise.all([getSitePageContent(), getSalesConfig()]);
  return (
    <SalesProvider value={sales}>
      <ShopChrome initialContent={initialContent}>{children}</ShopChrome>
    </SalesProvider>
  );
}
