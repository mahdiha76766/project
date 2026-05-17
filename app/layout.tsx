import './globals.css';
import type { Metadata } from 'next';
import { MainHeader } from '@/components/shop/MainHeader';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'فروشگاه روغن و ادویه | عصاره طبیعت',
  description: 'خرید آنلاین روغن‌های طبیعی، ادویه‌های اصیل و محصولات عصاری با ارسال سریع.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'فروشگاه روغن و ادویه | عصاره طبیعت',
    description: 'محصولات طبیعی و تازه با ضمانت کیفیت.',
    url: BASE_URL,
    type: 'website',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <MainHeader />
        {children}
      </body>
    </html>
  );
}
