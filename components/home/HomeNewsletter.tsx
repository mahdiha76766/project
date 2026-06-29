import Link from 'next/link';
import { Section } from './Section';
import { RtlForwardArrow } from './RtlForwardArrow';

export function HomeNewsletter() {
  return (
    <Section bg="white" className="!pb-20">
      <div className="rounded-3xl bg-brand-700 px-6 py-12 text-center sm:px-12 sm:py-14">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">آماده خرید هستید؟</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-brand-100">
          مجموعه کامل محصولات طبیعی را مرور کنید و با اطمینان سفارش دهید.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-surface-0 px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
            مشاهده محصولات
            <RtlForwardArrow />
          </Link>
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
            ثبت‌نام
          </Link>
        </div>
      </div>
    </Section>
  );
}
