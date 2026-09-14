import Link from 'next/link';
import { ChevronLeft, CircleHelp } from 'lucide-react';
import { Section } from './Section';
import { getHelpPage } from '@/lib/shop/help-content';

export function HomeFaq() {
  const faqs = getHelpPage('faq')?.faqs?.slice(0, 5) || [];

  return (
    <Section bg="white" className="!py-12 lg:!py-16">
      <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><CircleHelp className="h-5 w-5" /></span>
          <p className="site-label mt-5">پیش از خرید</p>
          <h2 className="mt-2 text-2xl font-black leading-snug text-surface-900 sm:text-3xl">پاسخ سؤال‌های پرتکرار</h2>
          <p className="mt-3 text-sm leading-7 text-surface-500">اطلاعات ضروری درباره انتخاب محصول، موجودی، پرداخت و پیگیری سفارش.</p>
          <Link href="/help/faq" className="site-btn-outline mt-6">مشاهده همه پرسش‌ها <ChevronLeft className="h-4 w-4" /></Link>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-surface-200 bg-surface-50 p-5 open:border-brand-200 open:bg-white open:shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-surface-900 [&::-webkit-details-marker]:hidden">
                {faq.question}<ChevronLeft className="h-4 w-4 shrink-0 text-surface-400 transition group-open:-rotate-90" />
              </summary>
              <p className="mt-4 border-t border-surface-200 pt-4 text-sm leading-7 text-surface-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
