import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronLeft, CircleHelp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { StorePageHeader } from '@/components/shop/store/StorePageHeader';
import { HELP_PAGES, getHelpPage } from '@/lib/shop/help-content';

export function generateStaticParams() {
  return HELP_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getHelpPage(slug);
  if (!page) return { title: 'راهنما یافت نشد' };
  return { title: page.title, description: page.description, alternates: { canonical: `/help/${page.slug}` } };
}

export default async function HelpDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getHelpPage(slug);
  if (!page) notFound();

  return (
    <>
      <StorePageHeader
        label="راهنمای فروشگاه"
        title={page.title}
        description={page.description}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'مرکز راهنما', href: '/help' }, { label: page.shortTitle }]}
      />
      <Container className="py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_17rem]">
          <article className="space-y-4">
            {page.sections?.map((section, index) => (
              <section key={section.title} className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft sm:p-7">
                <div className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-black text-brand-700">{(index + 1).toLocaleString('fa-IR')}</span>
                  <div>
                    <h2 className="font-black text-surface-900 sm:text-lg">{section.title}</h2>
                    {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-8 text-surface-600">{paragraph}</p>)}
                    {section.items?.length ? (
                      <ul className="mt-4 space-y-3">
                        {section.items.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-7 text-surface-600"><CheckCircle2 className="mt-1.5 h-4 w-4 shrink-0 text-brand-600" />{item}</li>)}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </section>
            ))}

            {page.faqs?.map((faq, index) => (
              <details key={faq.question} className="group rounded-2xl border border-surface-200 bg-white p-5 shadow-soft open:border-brand-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-surface-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3"><CircleHelp className="h-5 w-5 shrink-0 text-brand-600" />{faq.question}</span>
                  <span className="text-surface-400 transition group-open:-rotate-90"><ChevronLeft className="h-4 w-4" /></span>
                </summary>
                <p className="mt-4 border-t border-surface-100 pt-4 text-sm leading-8 text-surface-600">{faq.answer}</p>
              </details>
            ))}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
              <h3 className="text-sm font-black text-surface-900">موضوعات راهنما</h3>
              <nav className="mt-4 space-y-1">
                {HELP_PAGES.map((item) => (
                  <Link key={item.slug} href={`/help/${item.slug}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${item.slug === page.slug ? 'bg-brand-50 text-brand-800' : 'text-surface-500 hover:bg-surface-50'}`}>
                    {item.shortTitle}<ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </nav>
            </div>
            <div className="rounded-2xl bg-brand-900 p-5 text-white">
              <p className="text-sm font-black">نیاز به کمک دارید؟</p>
              <p className="mt-2 text-xs leading-6 text-brand-100/65">برای مشاوره محصول یا پیگیری سفارش با ما در ارتباط باشید.</p>
              <Link href="/contact" className="mt-4 inline-flex rounded-xl bg-accent-500 px-4 py-2.5 text-xs font-black">تماس با پشتیبانی</Link>
            </div>
          </aside>
        </div>
      </Container>
    </>
  );
}
