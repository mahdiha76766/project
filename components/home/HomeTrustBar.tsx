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
  return (
    <div className="border-b border-surface-200/70 bg-[#f7f3e8] py-5" dir="rtl">
      <div className="site-container">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.text} className="flex items-center gap-2.5 sm:justify-center lg:border-l lg:border-surface-200 last:lg:border-0">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold text-surface-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
