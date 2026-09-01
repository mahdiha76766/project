import Link from 'next/link';
import { Container } from '@/components/ui/Container';

export function FeedarHomeCta({ title, description }: { title?: string; description?: string }) {
  return (
    <section className="ph-section">
      <Container>
        <div className="ph-hero relative overflow-hidden rounded-[2.25rem] px-6 py-14 text-paper-50 sm:px-12">
          <div className="ph-grid pointer-events-none absolute inset-0 opacity-20" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="ph-kicker">COLLABORATION</p>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">{title || 'همکاری، مشاوره یا درخواست کاتالوگ'}</h2>
              <p className="mt-4 text-sm leading-8 text-paper-200">
                {description || 'برای ارتباط با تیم علمی و بازرگانی فیدار فارمد از صفحه تماس استفاده کنید یا منابع قابل دانلود را ببینید.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-full bg-paper-50 px-6 py-3 text-sm font-bold text-ink-900">
                تماس با ما
              </Link>
              <Link href="/downloads" className="rounded-full border border-paper-50/25 px-6 py-3 text-sm font-semibold">
                دانلودها
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
