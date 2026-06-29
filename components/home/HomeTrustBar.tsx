import { ShieldCheck, Truck, Leaf, CreditCard, Headphones, Award } from 'lucide-react';

const items = [
  { icon: Truck, text: 'ارسال سریع' },
  { icon: Leaf, text: 'محصولات اصل' },
  { icon: ShieldCheck, text: 'بسته‌بندی بهداشتی' },
  { icon: CreditCard, text: 'پرداخت امن' },
  { icon: Headphones, text: 'مشاوره رایگان' },
  { icon: Award, text: 'ضمانت اصالت' }
];

export function HomeTrustBar() {
  const list = [...items, ...items];
  return (
    <div className="border-y border-surface-200/80 bg-gradient-to-l from-surface-0 via-brand-50/40 to-surface-0 py-3.5" dir="rtl">
      <div className="overflow-hidden">
        <div className="marquee-rtl flex w-max items-center gap-12 whitespace-nowrap px-6">
          {list.map((item, i) => (
            <span key={`${item.text}-${i}`} className="inline-flex items-center gap-2.5 text-sm font-medium text-surface-700">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
                <item.icon className="h-3.5 w-3.5 text-brand-600" />
              </span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
