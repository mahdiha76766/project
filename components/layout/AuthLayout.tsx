import Link from 'next/link';
import { FpLogo } from '@/components/feedar/ui/Logo';
import { cn } from '@/lib/utils/cn';

type AuthLayoutProps = {
  variant: 'login' | 'register';
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export const AuthLayout = ({ variant, title, description, children, footer }: AuthLayoutProps) => {
  const headline = variant === 'login' ? 'ورود به حساب فیدار فارمد' : 'ساخت حساب جدید';
  const body =
    variant === 'login'
      ? 'برای مدیریت حساب، پیگیری همکاری‌ها و در صورت فعال بودن فروش، سفارش‌های قبلی وارد شوید.'
      : 'با ثبت‌نام، به اطلاعات حساب و سوابق خود دسترسی خواهید داشت.';

  return (
    <div className="min-h-screen bg-paper-100">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        <section className="ph-hero relative hidden overflow-hidden p-12 text-paper-50 lg:flex lg:flex-col lg:justify-between">
          <div className="ph-grid absolute inset-0 opacity-30" />
          <FpLogo inverted />
          <div className="relative max-w-md">
            <p className="ph-kicker">{variant === 'login' ? 'PORTAL' : 'MEMBERSHIP'}</p>
            <h1 className="mt-4 text-4xl font-black">{headline}</h1>
            <p className="mt-4 text-sm leading-8 text-paper-200">{body}</p>
          </div>
          <p className="relative text-xs text-gold-200">SCIENCE · QUALITY · TRUST</p>
        </section>
        <section className="flex flex-col justify-center px-5 py-10 sm:px-12">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <FpLogo />
            <Link href="/" className="text-sm text-surface-500">بازگشت</Link>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-paper-200 bg-paper-50 p-6 shadow-soft sm:p-8">
            <h2 className="text-xl font-black text-ink-900">{title}</h2>
            <p className="mt-2 text-sm text-surface-500">{description}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 border-t border-paper-200 pt-5 text-center text-sm text-surface-500">{footer}</div>
          </div>
          <Link href="/" className="mt-6 hidden text-center text-sm text-surface-400 lg:block">بازگشت به سایت</Link>
        </section>
      </div>
    </div>
  );
};

export const AuthLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-semibold text-gold-600 hover:text-gold-500">
    {children}
  </Link>
);

export const AuthAlert = ({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) => (
  <p className={cn('rounded-xl px-3 py-2.5 text-sm font-medium', tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700')}>
    {children}
  </p>
);
