import Link from 'next/link';
import { ArrowLeft, Headphones, PackageCheck, SearchCheck, ShoppingBasket, Truck } from 'lucide-react';
import { Section } from './Section';

const steps = [
  { title: 'پیدا کردن محصول', text: 'جستجو و فیلترهای کاربردی، انتخاب مناسب را سریع می‌کنند.', icon: SearchCheck },
  { title: 'انتخاب و ثبت سفارش', text: 'وزن، حجم و تعداد را انتخاب کنید و خلاصه سفارش را ببینید.', icon: ShoppingBasket },
  { title: 'بسته‌بندی و ارسال', text: 'سفارش آماده و وضعیت ارسال از حساب کاربری قابل پیگیری می‌شود.', icon: Truck }
];

export function HomePurchaseJourney({ productCount, categoryCount }: { productCount: number; categoryCount: number }) {
  return (
    <Section bg="white" className="!py-12 lg:!py-16">
      <div className="grid overflow-hidden rounded-[2rem] border border-surface-200 bg-surface-50 lg:grid-cols-[.8fr_1.2fr]">
        <div className="organic-grid bg-brand-900 p-7 text-white sm:p-9">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent-300"><PackageCheck className="h-5 w-5" /></span>
          <p className="mt-6 text-xs font-black text-accent-300">تجربه خرید کامل</p>
          <h2 className="mt-2 text-2xl font-black leading-snug sm:text-3xl">از انتخاب تا تحویل، مسیر روشن است.</h2>
          <p className="mt-4 text-sm leading-7 text-brand-100/65">تمام مراحل خرید، پرداخت و پیگیری در یک مسیر یکپارچه طراحی شده است.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <strong className="block text-2xl font-black">{productCount > 0 ? productCount.toLocaleString('fa-IR') : 'متنوع'}</strong>
              <span className="mt-1 block text-[10px] text-brand-100/55">محصول فعال</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <strong className="block text-2xl font-black">{categoryCount > 0 ? categoryCount.toLocaleString('fa-IR') : 'کامل'}</strong>
              <span className="mt-1 block text-[10px] text-brand-100/55">دسته‌بندی</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-9">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl bg-white p-4 shadow-soft">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><step.icon className="h-5 w-5" /></span>
                <div>
                  <p className="text-[10px] font-black text-accent-600">مرحله {(index + 1).toLocaleString('fa-IR')}</p>
                  <h3 className="mt-0.5 text-sm font-black text-surface-900">{step.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-surface-500">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/products" className="site-btn-primary">شروع خرید <ArrowLeft className="h-4 w-4" /></Link>
            <Link href="/contact" className="site-btn-outline"><Headphones className="h-4 w-4" /> مشاوره خرید</Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
