import Link from 'next/link';
import { BookOpen, ChevronLeft, CircleHelp, CreditCard, PackageCheck, RotateCcw, Scale, ShieldCheck, Truck } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { StorePageHeader } from '@/components/shop/store/StorePageHeader';
import { HELP_PAGES } from '@/lib/shop/help-content';

const icons = [BookOpen, Truck, RotateCcw, CreditCard, PackageCheck, ShieldCheck, Scale, CircleHelp];

export const metadata = {
  title: 'مرکز راهنمای خرید',
  description: 'راهنمای خرید، ارسال، پرداخت، بازگشت کالا و قوانین فروشگاه نابسرا.'
};

export default function HelpCenterPage() {
  return (
    <>
      <StorePageHeader
        label="پشتیبانی مشتریان"
        title="مرکز راهنمای خرید"
        description="هر چیزی که پیش از خرید، هنگام ثبت سفارش یا پس از تحویل نیاز دارید."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'راهنما' }]}
      />
      <Container className="py-10 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {HELP_PAGES.map((page, index) => {
            const Icon = icons[index] || CircleHelp;
            return (
              <Link key={page.slug} href={`/help/${page.slug}`} className="group flex min-h-52 flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
                <h2 className="mt-5 font-black text-surface-900 group-hover:text-brand-700">{page.shortTitle}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-6 text-surface-500">{page.description}</p>
                <span className="mt-auto flex items-center gap-1 pt-5 text-xs font-black text-brand-700">مشاهده راهنما <ChevronLeft className="h-3.5 w-3.5" /></span>
              </Link>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-brand-900 p-6 text-white sm:flex-row sm:items-center lg:p-8">
          <div>
            <h2 className="text-lg font-black">پاسخ سؤال‌تان را پیدا نکردید؟</h2>
            <p className="mt-2 text-sm text-brand-100/70">تیم پشتیبانی برای راهنمایی محصول و پیگیری سفارش کنار شماست.</p>
          </div>
          <Link href="/contact" className="rounded-xl bg-accent-500 px-5 py-3 text-sm font-black text-white">تماس با پشتیبانی</Link>
        </div>
      </Container>
    </>
  );
}
