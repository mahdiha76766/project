import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type AuthLayoutProps = {
  variant: 'login' | 'register';
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

const highlights = {
  login: {
    eyebrow: 'خوش آمدید',
    headline: 'ورود به حساب',
    body: 'سفارش‌ها را پیگیری کنید و خرید بعدی را سریع‌تر انجام دهید.',
    chips: ['پیگیری سفارش', 'ارسال سریع', 'پیشنهاد ویژه']
  },
  register: {
    eyebrow: 'عضویت',
    headline: 'ساخت حساب جدید',
    body: 'با ثبت‌نام، خرید و مدیریت سفارش‌ها برایتان ساده‌تر می‌شود.',
    chips: ['خرید آسان', 'تاریخچه سفارش', 'تخفیف‌ها']
  }
};

export const AuthLayout = ({ variant, title, description, children, footer }: AuthLayoutProps) => {
  const side = highlights[variant];

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">ع</span>
            <span className="font-bold text-surface-900">نابسرا</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-surface-500 hover:text-brand-600">
            بازگشت
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 pb-8 lg:grid-cols-2 lg:gap-16">
          <section className="hidden lg:block">
            <p className="site-label">{side.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold text-surface-900">{side.headline}</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-surface-500">{side.body}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {side.chips.map((chip) => (
                <span key={chip} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
                  {chip}
                </span>
              ))}
            </div>
          </section>

          <section>
            <div className="mx-auto w-full max-w-md rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-soft sm:p-8">
              <h2 className="text-xl font-bold text-surface-900">{title}</h2>
              <p className="mt-2 text-sm text-surface-500">{description}</p>
              <div className="mt-6">{children}</div>
              <div className="mt-6 border-t border-surface-200 pt-5 text-center text-sm text-surface-500">{footer}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export const AuthLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="font-semibold text-brand-600 hover:text-brand-700">
    {children}
  </Link>
);

export const AuthAlert = ({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) => (
  <p className={cn('rounded-xl px-3 py-2.5 text-sm font-medium', tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700')}>
    {children}
  </p>
);
