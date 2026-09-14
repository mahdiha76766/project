import Link from 'next/link';
import { Leaf, MessageCircle, ShieldCheck } from 'lucide-react';
import { Section } from './Section';
import { RtlForwardArrow } from './RtlForwardArrow';

export function HomeNewsletter() {
  return (
    <Section bg="white" className="!pb-20 lg:!pb-28">
      <div className="organic-grid relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-12 sm:px-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-accent-300"><Leaf className="h-5 w-5" /></span>
            <h2 className="mt-5 text-2xl font-black leading-snug text-white sm:text-3xl">انتخاب سالم، همین‌جا شروع می‌شود.</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-brand-100/70">محصولات طبیعی و اصیل را ببینید؛ اگر برای انتخاب نیاز به راهنمایی داشتید، کنار شما هستیم.</p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-brand-100/75">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent-300" /> خرید مطمئن</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-accent-300" /> مشاوره پیش از خرید</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:max-w-xs lg:justify-end">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-accent-400">
              ورود به فروشگاه
              <RtlForwardArrow className="text-white" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              دریافت مشاوره
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
