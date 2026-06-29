import Link from 'next/link';
import { Leaf, Package, Shield, Truck } from 'lucide-react';
import { Section } from './Section';
import { SectionHeading } from './SectionHeading';

const items = [
  { icon: Leaf, title: '۱۰۰٪ طبیعی', text: 'بدون افزودنی مصنوعی' },
  { icon: Shield, title: 'ضمانت اصالت', text: 'منشأ مشخص و شفاف' },
  { icon: Package, title: 'بسته‌بندی بهداشتی', text: 'استاندارد نگهداری' },
  { icon: Truck, title: 'ارسال مطمئن', text: 'سراسر کشور' }
];

export function HomeFeatures() {
  return (
    <Section bg="brand">
      <SectionHeading
        label="چرا ما"
        title="کیفیت که بهش اعتماد دارید"
        center
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-brand-200/60 bg-surface-0 p-6">
            <item.icon className="h-5 w-5 text-brand-600" />
            <h3 className="mt-4 font-bold text-surface-900">{item.title}</h3>
            <p className="mt-1 text-sm text-surface-500">{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function HomeAbout() {
  return (
    <Section bg="white">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-3xl bg-surface-100">
          <img
            src="https://images.unsplash.com/photo-1505577058444-a3dcf27d9753?w=800&q=80"
            alt="ادویه و گیاهان"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
        <div>
          <p className="site-label mb-3">درباره ما</p>
          <h2 className="site-heading">عطاری با استاندارد مدرن</h2>
          <p className="site-subtext mt-4">
            نابسرا ترکیبی از سنت عطاری و تجربه خرید آنلاین راحت است. هر محصول با دقت انتخاب،
            فرآوری و بسته‌بندی می‌شود تا با خیال راحت سفارش دهید.
          </p>
          <Link href="/products" className="site-btn-primary mt-8">
            شروع خرید
          </Link>
        </div>
      </div>
    </Section>
  );
}
