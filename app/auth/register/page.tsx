import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-[#e5dac6] bg-white p-6 shadow-[0_18px_50px_-35px_rgba(90,62,43,0.45)] sm:p-8">
        <p className="text-xs font-semibold text-[#7a6243]">عضویت جدید</p>
        <h1 className="mt-2 text-3xl font-black text-[#4d382b]">ایجاد حساب کاربری</h1>
        <p className="mt-2 text-sm text-[#6b5646]">برای خرید ساده‌تر و دریافت پیشنهادهای ویژه ثبت‌نام کنید.</p>

        <form action="/api/auth/register" method="post" className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">نام و نام خانوادگی</label>
            <input name="name" placeholder="مثال: علی محمدی" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">شماره موبایل</label>
            <input name="mobile" placeholder="09xxxxxxxxx" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">ایمیل</label>
            <input name="email" placeholder="name@email.com" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#5f4a3c]">رمز عبور</label>
            <input name="password" type="password" placeholder="حداقل 8 کاراکتر" className="w-full rounded-xl border border-[#dfd2bb] bg-[#fffdf8] px-3 py-2.5 text-sm outline-none transition focus:border-[#667744]" />
          </div>
          <button className="w-full rounded-xl bg-gradient-to-r from-[#667744] to-[#7b8b5a] p-3 text-sm font-bold text-white transition hover:brightness-105">ایجاد حساب</button>
        </form>

        <p className="mt-5 text-center text-sm text-[#6b5646]">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Link href="/auth/login" className="font-bold text-[#667744]">ورود</Link>
        </p>
      </div>
    </main>
  );
}
