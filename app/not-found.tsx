import type { Metadata } from 'next';
import { notFoundMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = notFoundMetadata('صفحه یافت نشد');

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-3xl font-black">404</h1>
      <p className="mt-3">صفحه موردنظر یافت نشد.</p>
    </main>
  );
}

