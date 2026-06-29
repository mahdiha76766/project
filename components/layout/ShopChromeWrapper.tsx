import { ShopChrome } from '@/components/layout/ShopChrome';
import { getSitePageContent } from '@/lib/admin/page-content';

export async function ShopChromeWrapper({ children }: { children: React.ReactNode }) {
  const initialContent = await getSitePageContent();
  return <ShopChrome initialContent={initialContent}>{children}</ShopChrome>;
}
