import { Container } from '@/components/ui/Container';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { FEEDAR_PARTNERS } from '@/lib/feedar/content';
import { parsePipeLines } from '@/lib/feedar/pipe-text';

export function FeedarHomePartners({ title, partnersText }: { title?: string; partnersText?: string }) {
  const fromCms = parsePipeLines(partnersText).map((item) => ({ name: item.title, href: item.text || '#' }));
  const base = fromCms.length ? fromCms : [...FEEDAR_PARTNERS];
  const items = [...base, ...base];

  return (
    <section className="site-section bg-white">
      <Container>
        <FpSectionHeader title={title || 'سایت‌ها و سازمان‌های مرتبط'} description="ارتباط علمی با نهادهای سلامت و مراکز دانشگاهی." />
        <div className="fp-partners-scroller mt-10 overflow-hidden">
          <div className="fp-partners-track flex w-max gap-4">
            {items.map((item, index) => (
              <a
                key={`${item.name}-${index}`}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-20 w-52 shrink-0 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50 px-4 text-center text-sm font-semibold text-surface-500 grayscale transition hover:grayscale-0 hover:text-brand-800"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
