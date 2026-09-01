import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  ...privatePageMetadata(),
  title: 'دسترسی غیرمجاز'
};

export default function UnauthorizedPage() {
  return (
    <main>
      <FpPageHero kicker="۴۰۳" title="دسترسی غیرمجاز" description="برای ورود به این بخش نقش مدیریت یا ویراستار لازم است." />
      <Container className="py-12">
        <div className="fp-card mx-auto max-w-lg p-8 text-center">
          <p className="text-sm leading-7 text-surface-500">اگر حساب مدیریت دارید وارد شوید؛ در غیر این صورت به سایت عمومی برگردید.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/auth/login?next=/admin" className="fp-btn-primary">ورود</Link>
            <Link href="/" className="fp-btn-outline">صفحه اصلی</Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
