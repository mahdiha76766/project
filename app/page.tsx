import Link from 'next/link';

const trustItems = ['ارسال سریع', 'ضمانت اصالت', 'پرداخت امن', 'پشتیبانی خرید', 'بسته‌بندی بهداشتی'];

const categories = [
  { name: 'روغن‌ها', desc: 'پرس سرد و تازه‌گیری روز', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5' },
  { name: 'ادویه‌ها', desc: 'عطر و طعم اصیل', image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f' },
  { name: 'ارده و شیره', desc: 'مقوی و طبیعی', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d' },
  { name: 'دمنوش‌ها', desc: 'آرامش‌بخش و سالم', image: 'https://images.unsplash.com/photo-1597481499666-3fef31a5f2c9' },
  { name: 'گیاهان دارویی', desc: 'انتخاب تخصصی', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6' },
  { name: 'پک‌های هدیه', desc: 'زیبا و کاربردی', image: 'https://images.unsplash.com/photo-1514996937319-344454492b37' }
];

const spiceCards = [
  { title: 'زردچوبه ممتاز', color: 'bg-amber-100' },
  { title: 'دارچین سیگاری', color: 'bg-orange-100' },
  { title: 'هل سبز اعلا', color: 'bg-lime-100' },
  { title: 'فلفل سیاه تازه', color: 'bg-stone-200' }
];

const testimonials = [
  { name: 'سمیرا احمدی', text: 'کیفیت روغن‌ها فوق‌العاده بود و بسته‌بندی بسیار تمیز بود.', rate: '★★★★★' },
  { name: 'مهدی نوروزی', text: 'ادویه‌ها خیلی خوش‌عطر بودند. ارسال هم سریع انجام شد.', rate: '★★★★★' },
  { name: 'الهام عباسی', text: 'پشتیبانی قبل از خرید عالی بود و دقیق راهنمایی شدم.', rate: '★★★★☆' }
];

const blogs = ['خواص روغن کنجد برای سلامتی', 'تشخیص روغن زیتون اصل', 'بهترین ادویه برای غذاهای ایرانی'];

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-14">
      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-l from-[#fff9ef] via-[#f9f5ea] to-[#eef2e6] p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs text-olive-900">طبیعی • سالم • اصیل</p>
            <h1 className="text-3xl font-black leading-tight text-[#5a3e2b] md:text-5xl">روغن‌های طبیعی و ادویه‌های اصیل، مستقیم از عصاری</h1>
            <p className="mt-4 text-slate-700">کیفیت تضمین‌شده، تولید تازه، ارسال سریع و بسته‌بندی کاملاً بهداشتی برای خریدی امن و مطمئن.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-xl bg-[#667744] px-5 py-3 text-white transition hover:opacity-90">مشاهده محصولات</Link>
              <Link href="/products?category=oils" className="rounded-xl border border-[#c69a3a] bg-white px-5 py-3 text-[#5a3e2b] transition hover:bg-amber-50">خرید روغن‌های تازه</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f', 'https://images.unsplash.com/photo-1505253213348-cd54c92b37be', 'https://images.unsplash.com/photo-1514996937319-344454492b37'].map((src) => (
              <img key={src} src={src} alt="محصولات طبیعی" className="h-32 w-full rounded-2xl object-cover md:h-40" />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-amber-100 bg-white p-3 md:grid-cols-5">
        {trustItems.map((item) => <div key={item} className="rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-[#5a3e2b]">{item}</div>)}
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <img src="https://images.unsplash.com/photo-1510626176961-4b57d4fbad03" alt="روغن تازه‌گیری‌شده" className="h-72 w-full rounded-3xl object-cover lg:h-full" />
        <div className="rounded-3xl border border-amber-100 bg-white p-6">
          <h2 className="text-2xl font-black text-[#5a3e2b]">روغن‌های تازه‌گیری‌شده</h2>
          <p className="mt-3 leading-8 text-slate-700">روغن‌ها به‌صورت روزانه و با دستگاه پرس سرد تولید می‌شوند تا ارزش غذایی، عطر و کیفیت طبیعی آن‌ها حفظ شود.</p>
          <ul className="mt-4 grid gap-2 text-sm text-[#5a3e2b] md:grid-cols-2">
            {['پرس سرد', 'بدون افزودنی', 'بسته‌بندی بهداشتی', 'مناسب مصرف روزانه'].map((f) => <li key={f} className="rounded-lg bg-amber-50 px-3 py-2">✓ {f}</li>)}
          </ul>
          <Link href="/products?category=oils" className="mt-5 inline-block rounded-xl bg-[#667744] px-5 py-3 text-white">خرید روغن‌های تازه</Link>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-100 bg-gradient-to-l from-orange-50 to-amber-50 p-6">
        <h2 className="text-2xl font-black text-[#5a3e2b]">ادویه‌های اصیل و معطر</h2>
        <p className="mt-2 text-slate-700">ترکیب رنگ، عطر و اصالت در ادویه‌هایی که طعم غذای ایرانی را بی‌نظیر می‌کنند.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {spiceCards.map((s) => <div key={s.title} className={`rounded-2xl p-4 ${s.color} transition hover:-translate-y-1`}><p className="font-bold text-[#5a3e2b]">{s.title}</p></div>)}
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-[#5a3e2b] p-6 text-white md:p-8">
        <p className="text-sm text-amber-200">پیشنهاد روز</p>
        <h3 className="mt-1 text-2xl font-black">تا ۲۰٪ تخفیف روی روغن‌های منتخب</h3>
        <p className="mt-2 text-white/90">فرصت محدود برای خرید اقتصادی‌تر محصولات تازه‌گیری‌شده.</p>
        <Link href="/products" className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-3">خرید با تخفیف</Link>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-black text-[#5a3e2b]">چرا از ما خرید کنید؟</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {['کیفیت تضمین‌شده', 'ارسال سریع', 'محصولات تازه', 'مشاوره خرید', 'بسته‌بندی سالم', 'قیمت منصفانه'].map((v) => <div key={v} className="rounded-2xl border border-amber-100 bg-white p-4">{v}</div>)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-black text-[#5a3e2b]">نظرات مشتریان</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => <article key={t.name} className="rounded-2xl border border-amber-100 bg-white p-4"><p className="text-amber-700">{t.rate}</p><p className="mt-2 text-slate-700">{t.text}</p><p className="mt-3 text-sm font-bold text-[#5a3e2b]">{t.name}</p></article>)}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-black text-[#5a3e2b]">بلاگ آموزشی</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {blogs.map((b) => <article key={b} className="rounded-2xl border border-amber-100 bg-white p-4 transition hover:shadow-md"><h3 className="font-bold text-[#5a3e2b]">{b}</h3><p className="mt-2 text-sm text-slate-600">مطالعه مقاله و نکات تخصصی خرید</p></article>)}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-amber-200 bg-gradient-to-l from-[#eef2e6] to-[#fff6e8] p-8 text-center">
        <h2 className="text-3xl font-black text-[#5a3e2b]">آماده خرید محصولات طبیعی هستید؟</h2>
        <p className="mt-2 text-slate-700">همین حالا از بین روغن‌ها، ادویه‌ها و محصولات عصاری انتخاب کنید.</p>
        <Link href="/products" className="mt-5 inline-block rounded-xl bg-[#667744] px-6 py-3 text-white">شروع خرید</Link>
      </section>

      <footer className="mt-12 grid gap-6 rounded-3xl bg-[#2f261f] p-7 text-white md:grid-cols-4">
        <div><h4 className="font-bold">لینک‌های مهم</h4><ul className="mt-3 space-y-2 text-sm text-white/80"><li>صفحه اصلی</li><li>محصولات</li><li>بلاگ</li><li>تماس با ما</li></ul></div>
        <div><h4 className="font-bold">دسته‌بندی‌ها</h4><ul className="mt-3 space-y-2 text-sm text-white/80"><li>روغن‌ها</li><li>ادویه‌ها</li><li>دمنوش‌ها</li><li>پک هدیه</li></ul></div>
        <div><h4 className="font-bold">اطلاعات تماس</h4><ul className="mt-3 space-y-2 text-sm text-white/80"><li>۰۲۱-۱۲۳۴۵۶۷۸</li><li>تهران، بازار گیاهان دارویی</li><li>اینستاگرام | تلگرام</li><li>نماد اعتماد: ✅</li></ul></div>
        <div><h4 className="font-bold">خبرنامه</h4><p className="mt-3 text-sm text-white/80">برای دریافت پیشنهادهای ویژه عضو شوید.</p><div className="mt-3 flex gap-2"><input className="w-full rounded-lg px-3 py-2 text-sm text-slate-900" placeholder="شماره موبایل یا ایمیل" /><button className="rounded-lg bg-amber-500 px-3 py-2 text-sm">عضویت</button></div><p className="mt-3 text-xs text-white/70">قوانین ارسال • قوانین مرجوعی</p></div>
      </footer>
    </main>
  );
}
