'use client';

import { usePathname } from 'next/navigation';
import { MainHeader } from '@/components/shop/MainHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
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
      <MainHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </SiteContentProvider>
  );
};
