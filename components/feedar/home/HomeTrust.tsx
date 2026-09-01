import { Award, Microscope, ScrollText, Users } from 'lucide-react';
import { Container } from '@/components/ui/Container';

const items = [
  { icon: Microscope, title: 'تحقیق و توسعه', text: 'فرمولاسیون بر پایه داده، آزمون و مستندات علمی.' },
  { icon: Award, title: 'کنترل کیفیت', text: 'رعایت استانداردهای بهداشتی و ردیابی مواد اولیه.' },
  { icon: Users, title: 'ارتباط علمی', text: 'همکاری با جامعه پزشکی، دارویی و شرکای تخصصی.' },
  { icon: ScrollText, title: 'شفافیت', text: 'اطلاعات محصول، آموزش و منابع قابل دانلود برای همکاران.' }
];

export function FeedarHomeTrust() {
  return (
    <section className="site-section">
      <Container>
        <p className="fp-kicker">چرا فیدار فارمد</p>
        <h2 className="mt-3 text-2xl font-bold text-surface-900 sm:text-3xl">اعتماد بر پایه فرآیند علمی</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <article key={item.title} className="rounded-3xl border border-surface-200 bg-white p-5">
              <item.icon className="h-5 w-5 text-brand-700" />
              <h3 className="mt-4 text-base font-bold text-surface-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-surface-500">{item.text}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
