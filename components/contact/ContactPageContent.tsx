'use client';

import { Mail, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ContactMap } from '@/components/contact/ContactMap';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableHtml, EditableText } from '@/components/cms/EditableContent';

export function ContactPageContent() {
  const { content, patchContent } = useSiteContent();
  const contact = content.contact;

  const saveContact = (field: keyof typeof contact, value: string) =>
    patchContent({ contact: { ...contact, [field]: value } });

  const saveMap = async (lat: number, lng: number, zoom: number) =>
    patchContent({ contact: { ...contact, mapLat: lat, mapLng: lng, mapZoom: zoom } });

  return (
    <div className="bg-gradient-to-b from-brand-50/40 via-surface-0 to-surface-50">
      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-bold text-brand-700">
            <MessageCircle className="h-3.5 w-3.5" />
            پشتیبانی و ارتباط
          </span>
          <EditableText value={contact.title} onSave={(v) => saveContact('title', v)} as="h1" className="site-heading block" label="عنوان تماس" />
          <EditableText value={contact.subtitle} onSave={(v) => saveContact('subtitle', v)} as="p" className="site-subtext mt-4 block" multiline label="زیرعنوان" />
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-5">
          <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-card lg:col-span-3">
            <EditableHtml html={contact.bodyHtml} onSave={(v) => saveContact('bodyHtml', v)} label="متن تماس با ما" />
          </div>

          <div className="space-y-3 lg:col-span-2">
            {[
              { icon: Phone, field: 'phone' as const, label: 'تلفن' },
              { icon: Mail, field: 'email' as const, label: 'ایمیل' },
              { icon: MapPin, field: 'address' as const, label: 'آدرس' },
              { icon: Clock, field: 'hours' as const, label: 'ساعات کاری' }
            ].map(({ icon: Icon, field, label }) => (
              <div key={field} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition hover:border-brand-200">
                <div className="flex items-center gap-2 text-sm font-bold text-surface-800">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></span>
                  {label}
                </div>
                <div className="mt-2 text-sm text-surface-600">
                  <EditableText value={contact[field]} onSave={(v) => saveContact(field, v)} as="p" label={`ویرایش ${label}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl space-y-4">
          <EditableText value={contact.mapTitle} onSave={(v) => saveContact('mapTitle', v)} as="h2" className="text-lg font-black text-surface-900" label="عنوان نقشه" />
          <ContactMap
            lat={contact.mapLat}
            lng={contact.mapLng}
            zoom={contact.mapZoom}
            title={contact.mapTitle}
            onLocationChange={saveMap}
          />
        </div>
      </Container>
    </div>
  );
}
