import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';
import { getSiteSeoSettings } from '@/lib/admin/site-settings';
import { buildSiteMetadata } from '@/lib/seo/site-metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  return buildSiteMetadata(seo, {
    title: 'تماس با ما',
    alternates: { canonical: '/contact' }
  });
}

export default function ContactPage() {
  return <ContactPageContent />;
}
