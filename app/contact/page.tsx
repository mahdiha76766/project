import type { Metadata } from 'next';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FeedarContactForm } from '@/components/feedar/contact/ContactForm';
import { ContactMap } from '@/components/contact/ContactMap';
import { getSitePageContent } from '@/lib/admin/page-content';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';
import { stripHtml } from '@/lib/feedar/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return buildPublicMetadata({
    title: 'تماس با ما',
    description: `راه‌های ارتباط با ${FEEDAR_BRAND.nameFa} — همکاری، کاتالوگ و پشتیبانی علمی`,
    canonicalPath: '/contact'
  });
}

export default async function ContactPage() {
  const { contact } = await getSitePageContent();

  return (
    <>
      <FpPageHero
        kicker="ارتباط"
        title={contact.title}
        description={contact.subtitle}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'تماس با ما' }]}
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="text-sm leading-8 text-surface-600">{stripHtml(contact.bodyHtml)}</p>
          <FeedarContactForm />
        </div>
        <div className="space-y-3">
          {[
            { icon: Phone, label: 'تلفن', value: contact.phone },
            { icon: Mail, label: 'ایمیل', value: contact.email },
            { icon: MapPin, label: 'آدرس', value: contact.address },
            { icon: Clock, label: 'ساعات کاری', value: contact.hours }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="fp-card p-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-800">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
              <p className="mt-2 text-sm text-surface-600">{value || '—'}</p>
            </div>
          ))}
        </div>
      </Container>
      <Container className="pb-16">
        <h2 className="mb-4 text-lg font-bold">{contact.mapTitle}</h2>
        <ContactMap lat={contact.mapLat} lng={contact.mapLng} zoom={contact.mapZoom} title={contact.mapTitle} />
      </Container>
    </>
  );
}
