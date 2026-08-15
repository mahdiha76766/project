import type { Metadata } from 'next';
import { ContactPageContent } from '@/components/contact/ContactPageContent';
import { buildPublicMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({
    title: 'تماس با ما',
    description: 'راه‌های ارتباط با فروشگاه ناب سرا — پشتیبانی، سفارش و مشاوره محصولات گیاهی',
    canonicalPath: '/contact'
  });
}

export default function ContactPage() {
  return <ContactPageContent />;
}
