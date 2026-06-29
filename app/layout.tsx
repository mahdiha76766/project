import './globals.css';
import type { Metadata } from 'next';

/** داده‌ها از MongoDB می‌آیند — در زمان build به DB وصل نمی‌شود */
export const dynamic = 'force-dynamic';
import { ShopChromeWrapper } from '@/components/layout/ShopChromeWrapper';
import { SiteScripts } from '@/components/seo/SiteScripts';
import { getSiteSeoSettings } from '@/lib/admin/site-settings';
import { buildSiteMetadata } from '@/lib/seo/site-metadata';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  return buildSiteMetadata(seo);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const seo = await getSiteSeoSettings();

  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <SiteScripts seo={seo} />
        <ShopChromeWrapper>{children}</ShopChromeWrapper>
      </body>
    </html>
  );
}
