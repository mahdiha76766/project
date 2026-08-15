import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPricePortalSettings } from '@/lib/admin/price-portal-settings';
import { PricePortalClient } from '@/components/price-portal/PricePortalClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ portalPath: string }> };

export const metadata: Metadata = {
  title: 'لیست قیمت',
  robots: { index: false, follow: false }
};

export default async function PricePortalPublicPage({ params }: Props) {
  const { portalPath } = await params;
  const settings = await getPricePortalSettings();

  if (!settings.enabled || portalPath !== settings.pathSlug) {
    notFound();
  }

  return <PricePortalClient />;
}
