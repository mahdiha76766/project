'use client';

import Link from 'next/link';
import { ArrowUpLeft, Leaf, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableHtml, EditableText } from '@/components/cms/EditableContent';

const links = {
  shop: [
    { href: '/products', label: 'همه محصولات' },
    { href: '/categories', label: 'دسته‌بندی‌ها' },
    { href: '/products?discount=1', label: 'پیشنهادهای ویژه' },
    { href: '/blog', label: 'مجله سلامت' }
  ],
  service: [
    { href: '/help/shopping-guide', label: 'راهنمای خرید' },
    { href: '/help/shipping', label: 'ارسال و تحویل' },
    { href: '/help/returns', label: 'بازگشت کالا' },
    { href: '/help/faq', label: 'پرسش‌های پرتکرار' }
  ],
  account: [
    { href: '/dashboard/orders', label: 'پیگیری سفارش' },
    { href: '/dashboard/wishlist', label: 'علاقه‌مندی‌ها' },
    { href: '/help/privacy', label: 'حریم خصوصی' },
    { href: '/help/terms', label: 'قوانین فروشگاه' }
  ]
};

export const SiteFooter = () => {
  const { content, patchContent } = useSiteContent();
  const footer = content.footer;
  const header = content.header;

  const saveFooter = (field: keyof typeof footer, value: string) =>
    patchContent({ footer: { ...footer, [field]: value } });

  return (
    <footer className="organic-grid mt-auto overflow-hidden bg-brand-900 text-white">
      <Container className="py-14 lg:py-20">
        <div className="mb-12 flex flex-col justify-between gap-6 border-b border-white/10 pb-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black text-accent-300">از طبیعت، تا خانه شما</p>
            <h2 className="mt-2 text-xl font-black sm:text-2xl">برای یک انتخاب سالم‌تر آماده‌اید؟</h2>
          </div>
          <Link href="/products" className="inline-flex w-fit items-center gap-2 rounded-2xl bg-accent-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-400">ورود به فروشگاه <ArrowUpLeft className="h-4 w-4" /></Link>
        </div>
        <div className="grid items-start gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(0,.65fr))_auto]">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent-300"><Leaf className="h-5 w-5" /></span>
              <div>
                <span className="block text-lg font-black text-white">{header.brandName}</span>
                <span className="text-[10px] text-brand-200/60">{header.brandTagline}</span>
              </div>
            </div>
            <div className="mt-5 max-w-md text-sm leading-7 text-brand-100/65 [&_*]:!text-brand-100/65">
              <EditableHtml html={footer.aboutHtml} onSave={(v) => saveFooter('aboutHtml', v)} label="متن فوتر" />
            </div>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[10px] font-bold text-brand-100/70"><ShieldCheck className="h-3.5 w-3.5 text-accent-300" /> خرید امن و تضمین اصالت کالا</span>
          </div>
          <div>
            <EditableText value={footer.shopTitle} onSave={(v) => saveFooter('shopTitle', v)} as="h3" className="text-sm font-black text-white" label="عنوان فروشگاه" />
            <ul className="mt-5 space-y-3">
              {links.shop.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-brand-100/60 transition hover:pr-1 hover:text-accent-300">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-black text-white">خدمات مشتریان</h3>
            <ul className="mt-5 space-y-3">
              {links.service.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-brand-100/60 transition hover:pr-1 hover:text-accent-300">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <EditableText value={footer.accountTitle} onSave={(v) => saveFooter('accountTitle', v)} as="h3" className="text-sm font-black text-white" label="عنوان حساب" />
            <ul className="mt-5 space-y-3">
              {links.account.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm text-brand-100/60 transition hover:pr-1 hover:text-accent-300">{link.label}</Link></li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center rounded-2xl bg-white p-3 sm:justify-start lg:justify-end">
            <a
              referrerPolicy="origin" target="_blank" href="https://trustseal.enamad.ir/?id=7278140&amp;Code=PUWocCe8e6MBXjbwSVSHdCddu9TvhNPI"
            >

              <img src="/enamad.png" alt="نماد اعتماد الکترونیکی" />
            </a>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <EditableText value={footer.copyright} onSave={(v) => saveFooter('copyright', v)} className="text-xs text-brand-100/45" as="p" label="کپی‌رایت" />
          <EditableText value={footer.bottomNote} onSave={(v) => saveFooter('bottomNote', v)} className="text-xs text-brand-100/45" as="p" label="یادداشت پایین" />
        </div>
      </Container>
    </footer>
  );
};
