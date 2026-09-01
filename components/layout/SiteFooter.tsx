'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableHtml, EditableText } from '@/components/cms/EditableContent';

const links = {
  shop: [
    { href: '/products', label: 'همه محصولات' },
    { href: '/categories', label: 'دسته‌بندی‌ها' },
    { href: '/blog', label: 'مجله سلامت' },
    { href: '/contact', label: 'تماس با ما' }
  ]
};

export const SiteFooter = () => {
  const { content, patchContent } = useSiteContent();
  const footer = content.footer;
  const header = content.header;

  const saveFooter = (field: keyof typeof footer, value: string) =>
    patchContent({ footer: { ...footer, [field]: value } });

  return (
    <footer className="mt-auto border-t border-surface-200 bg-gradient-to-b from-surface-100 to-surface-50">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">ع</span>
              <span className="text-lg font-black text-surface-900">{header.brandName}</span>
            </div>
            <div className="mt-4 max-w-md">
              <EditableHtml html={footer.aboutHtml} onSave={(v) => saveFooter('aboutHtml', v)} label="متن فوتر" />
            </div>
          </div>
          <div>
            <EditableText value={footer.shopTitle} onSave={(v) => saveFooter('shopTitle', v)} as="h3" className="text-sm font-bold text-surface-900" label="عنوان فروشگاه" />
            <ul className="mt-4 space-y-2.5">
              {links.shop.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-surface-500 transition hover:text-brand-600">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-surface-200 pt-6 sm:flex-row">
          <EditableText value={footer.copyright} onSave={(v) => saveFooter('copyright', v)} className="text-xs text-surface-400" as="p" label="کپی‌رایت" />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <EditableText value={footer.bottomNote} onSave={(v) => saveFooter('bottomNote', v)} className="text-xs text-surface-400" as="p" label="یادداشت پایین" />
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
        </div>
      </Container>
    </footer>
  );
};
