'use client';

import { usePathname } from 'next/navigation';
import { FeedarSiteChromeHeader } from '@/components/feedar/layout/SiteHeader';
import { FeedarFooter } from '@/components/feedar/layout/SiteFooter';
import { SiteContentProvider } from '@/components/cms/SiteContentProvider';
import { EditModeToolbar } from '@/components/cms/EditModeToolbar';
import { SiteAnalyticsTracker } from '@/components/analytics/SiteAnalyticsTracker';
import type { SitePageContent } from '@/lib/admin/page-content-config';

export const ShopChrome = ({
  children,
  initialContent
}: {
  children: React.ReactNode;
  initialContent?: SitePageContent;
}) => {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith('/auth') || pathname.startsWith('/admin');

  if (hideChrome) return <>{children}</>;

  return (
    <SiteContentProvider initial={initialContent}>
      <SiteAnalyticsTracker />
      <EditModeToolbar />
      <FeedarSiteChromeHeader />
      <div className="flex-1">{children}</div>
      <FeedarFooter />
    </SiteContentProvider>
  );
};
