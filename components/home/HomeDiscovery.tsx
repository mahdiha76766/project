import Link from 'next/link';
import { ArrowLeft, BadgePercent, CookingPot, Droplets, Leaf } from 'lucide-react';
import { Section } from './Section';

const discoveryItems = [
  {
    title: 'خوراکی و آشپزی',
    text: 'روغن، ادویه و محصولات مناسب مصرف خوراکی',
    href: '/products?usage=EDIBLE',
    icon: CookingPot,
    tone: 'bg-amber-50 text-amber-800'
  },
  {
    title: 'مراقبت پوست و مو',
    text: 'محصولات مناسب استفاده موضعی',
    href: '/products?usage=TOPICAL',
    icon: Droplets,
    tone: 'bg-sky-50 text-sky-800'
  },
  {
    title: 'چندمنظوره',
    text: 'محصولات با کاربرد خوراکی و موضعی',
    href: '/products?usage=BOTH',
    icon: Leaf,
    tone: 'bg-emerald-50 text-emerald-800'
  },
  {
    title: 'تخفیف‌دار',
    text: 'محصولات دارای تخفیف',
    href: '/products?discount=1',
    icon: BadgePercent,
    tone: 'bg-rose-50 text-rose-800'
  }
];

export function HomeDiscovery() {
  return (
    <Section bg="default" className="!py-12 lg:!py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="site-label">دسته‌بندی کاربرد</p>
          <h2 className="mt-2 text-2xl font-black text-surface-900 sm:text-3xl">خرید بر اساس کاربرد</h2>
          <p className="mt-2 text-sm leading-7 text-surface-500">محصولات را بر اساس نوع استفاده فیلتر کنید.</p>
        </div>
        <Link href="/products" className="site-link">همه محصولات <ArrowLeft className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {discoveryItems.map((item, index) => (
          <Link key={item.href} href={item.href} className="group flex min-h-52 flex-col rounded-2xl border border-surface-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span>
              <span className="text-[10px] font-black text-surface-300">{(index + 1).toLocaleString('fa-IR', { minimumIntegerDigits: 2 })}</span>
            </div>
            <h3 className="mt-5 font-black text-surface-900 group-hover:text-brand-700">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-surface-500">{item.text}</p>
            <span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-black text-brand-700">مشاهده محصولات <ArrowLeft className="h-3.5 w-3.5" /></span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
