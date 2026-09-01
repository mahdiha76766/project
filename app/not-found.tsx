import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { notFoundMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = notFoundMetadata('صفحه یافت نشد');

export default function NotFound() {
  return (
    <main>
      <FpPageHero kicker="۴۰۴" title="صفحه یافت نشد" description="آدرس واردشده در سایت فیدار فارمد موجود نیست." />
      <Container className="py-12">
        <div className="fp-card mx-auto max-w-lg p-8 text-center">
          <p className="text-sm leading-7 text-surface-500">می‌توانید به صفحه اصلی برگردید یا محصولات را ببینید.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="fp-btn-primary">صفحه اصلی</Link>
            <Link href="/products" className="fp-btn-outline">محصولات</Link>
            <Link href="/contact" className="fp-btn-outline">تماس با ما</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
