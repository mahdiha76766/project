'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableHtml, EditableText } from '@/components/cms/EditableContent';
import { FpLogo } from '@/components/feedar/ui/Logo';
import { FEEDAR_FOOTER_COLUMNS } from '@/lib/brand/feedar';
import { FEEDAR_LEGAL_LINKS } from '@/lib/feedar/content';
import { socialsFromContact } from '@/lib/feedar/socials';
import { CommerceOnly } from '@/components/commerce/SalesProvider';

export function FeedarFooter() {
  const { content, patchContent } = useSiteContent();
  const footer = content.footer;
  const contact = content.contact;
  const socials = socialsFromContact(contact);

  const saveFooter = (field: keyof typeof footer, value: string) =>
    patchContent({ footer: { ...footer, [field]: value } });

  return (
    <footer className="mt-auto border-t border-paper-200 bg-paper-50">
      <Container className="grid gap-10 py-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FpLogo name={content.header.brandName} />
          <div className="mt-5 max-w-md text-sm leading-8 text-surface-500">
            <EditableHtml html={footer.aboutHtml} onSave={(v) => saveFooter('aboutHtml', v)} label="متن فوتر" />
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3 lg:col-span-7">
          <div>
            <h2 className="text-sm font-black text-ink-900">شرکت</h2>
            <ul className="mt-4 space-y-2.5">
              {FEEDAR_FOOTER_COLUMNS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-surface-500 hover:text-gold-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-black text-ink-900">{footer.shopTitle || 'محصولات'}</h2>
            <ul className="mt-4 space-y-2.5">
              {FEEDAR_FOOTER_COLUMNS.products.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-surface-500 hover:text-gold-600">
                    {link.label}
                  </Link>
                </li>
              ))}
              <CommerceOnly>
                <li>
                  <Link href="/cart" className="text-sm text-surface-500 hover:text-gold-600">
                    سبد خرید
                  </Link>
                </li>
              </CommerceOnly>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-black text-ink-900">تماس</h2>
            <ul className="mt-4 space-y-2 text-sm text-surface-500">
              {contact.phone ? <li>{contact.phone}</li> : null}
              {contact.email ? <li>{contact.email}</li> : null}
              {contact.address ? <li>{contact.address}</li> : null}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-paper-200 px-3 py-1 text-xs text-ink-800"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>
      <div className="border-t border-paper-200 bg-ink-900">
        <Container className="flex flex-col items-center justify-between gap-3 py-4 text-xs text-paper-200 sm:flex-row">
          <EditableText value={footer.copyright} onSave={(v) => saveFooter('copyright', v)} className="text-paper-200" as="p" label="کپی‌رایت" />
          <div className="flex flex-wrap items-center justify-center gap-4">
            {FEEDAR_LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gold-200">
                {link.label}
              </Link>
            ))}
            <a
              className="landing-footer-license-item"
              referrerPolicy="origin"
              target="_blank"
              rel="noopener noreferrer"
              href="https://trustseal.enamad.ir/?id=617050&Code=eLTp7Bf3qunGJq2SMmW5wjwoFDFe085L"
            >
              <img src="/enamad.png" alt="نماد اعتماد الکترونیکی" />
            </a>
          </div>
        </Container>
      </div>
      <a
        href={socials.find((s) => s.icon === 'whatsapp')?.href || '/contact'}
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-gold-200 shadow-card"
        aria-label="واتساپ"
      >
        W
      </a>
    </footer>
  );
}
