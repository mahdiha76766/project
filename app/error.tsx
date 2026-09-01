'use client';

import Link from 'next/link';
import './globals.css';
import { Container } from '@/components/ui/Container';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-surface-50 text-surface-900">
        <main className="min-h-screen py-16">
          <Container>
            <div className="fp-card mx-auto max-w-lg p-8 text-center">
              <p className="text-xs font-bold text-brand-800">خطا</p>
              <h1 className="mt-2 text-2xl font-black">مشکلی پیش آمد</h1>
              <p className="mt-3 text-sm leading-7 text-surface-500">لطفاً دوباره تلاش کنید یا به صفحه اصلی برگردید.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => reset()} className="fp-btn-primary">تلاش دوباره</button>
                <Link href="/" className="fp-btn-outline">صفحه اصلی</Link>
              </div>
            </div>
          </Container>
        </main>
      </body>
    </html>
  );
}
