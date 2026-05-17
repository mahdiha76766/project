import Link from 'next/link';

const trustItems = [
  'ارسال سریع و مطمئن',
  'ضمانت اصالت کالا',
  'پشتیبانی واقعی خرید',
  'مرجوعی تا ۷ روز'
];

const categories = [
  { title: 'روغن‌های طبیعی', desc: 'پرس سرد و تازه‌گیری روز', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', href: '/products?category=oils' },
  { title: 'ادویه‌های اصیل', desc: 'عطر و طعم تازه ایرانی', image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f', href: '/products?category=spices' },
  { title: 'ارده و شیره', desc: 'مقوی و طبیعی', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d', href: '/products?category=pastes-syrups' },
  { title: 'دمنوش و گیاهان', desc: 'آرامش‌بخش و سالم', image: 'https://images.unsplash.com/photo-1597481499666-3fef31a5f2c9', href: '/products?category=herbs' }
];

const bestSellers = [
  { name: 'روغن کنجد بکر', desc: 'تازه‌گیری روزانه، بدون افزودنی', price: '۴۸۰,۰۰۰', sale: '۴۱۰,۰۰۰', rating: '4.8', stock: 'موجود', image: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03' },
  { name: 'روغن زیتون فرابکر', desc: 'اسیدیته پایین، عطر طبیعی', price: '۶۲۰,۰۰۰', sale: '۵۵۰,۰۰۰', rating: '4.9', stock: 'موجود', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5' },
  { name: 'زردچوبه ممتاز', desc: 'رنگ‌دهی قوی و عطر تازه', price: '۲۱۰,۰۰۰', sale: '۱۸۵,۰۰۰', rating: '4.7', stock: 'موجود', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d' },
  { name: 'هل سبز اعلا', desc: 'دانه درشت و معطر', price: '۷۸۰,۰۰۰', sale: '۷۲۰,۰۰۰', rating: '4.9', stock: 'محدود', image: 'https://images.unsplash.com/photo-1611250188496-e966043a0629' }
];

const testimonials = [
  { name: 'سمیرا احمدی', text: 'کیفیت روغن‌ها عالی بود و دقیقاً همان چیزی بود که برای مصرف روزانه می‌خواستم.' },
  { name: 'مهدی نوروزی', text: 'ادویه‌ها خیلی تازه و خوش‌عطر بودند. بسته‌بندی هم بسیار حرفه‌ای بود.' },
  { name: 'الهام عباسی', text: 'پشتیبانی قبل از خرید خیلی خوب راهنمایی کرد. تجربه خرید کاملاً رضایت‌بخش بود.' }
];

const blogPosts = [
  { title: 'چطور روغن کنجد اصل را تشخیص دهیم؟', href: '/blog/identify-original-oil' },
  { title: 'بهترین ادویه‌ها برای غذاهای ایرانی', href: '/blog/best-iranian-spices' },
  { title: 'نگهداری صحیح روغن‌های طبیعی در خانه', href: '/blog/oil-storage-guide' }
];

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <section className="mt-6 overflow-hidden rounded-3xl border border-[#e6dcc8] bg-gradient-to-l from-[#f4efe2] to-[#fcfaf5] shadow-[0_18px_45px_-32px_rgba(90,62,43,0.35)]">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:p-10">
          <div>
            <p className="inline-block rounded-full border border-[#dbcaa6] bg-[#f9f2df] px-3 py-1 text-xs font-semibold text-[#7a6243]">فروشگاه تخصصی روغن و ادویه</p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-[#4d382b] sm:text-4xl">خرید مطمئن محصولات عصاری با کیفیت واقعی</h1>
            <p className="mt-4 text-sm leading-7 text-[#5f4a3c] sm:text-base">روغن‌های پرس سرد، ادویه‌های اصیل و محصولات طبیعی را با ضمانت کیفیت، ارسال سریع و پشتیبانی حرفه‌ای از عصاره طبیعت تهیه کنید.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/products" className="rounded-xl bg-[#667744] px-6 py-3 text-center font-bold text-white transition hover:brightness-105">مشاهده محصولات</Link>
              <Link href="/categories" className="rounded-xl border border-[#bfa886] bg-white px-6 py-3 text-center font-bold text-[#5a3e2b] transition hover:bg-[#faf5eb]">دسته‌بندی‌ها</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white p-2">
            <img src="https://images.unsplash.com/photo-1510626176961-4b57d4fbad03" alt="روغن طبیعی و تازه" className="h-64 w-full rounded-xl object-cover sm:h-72 lg:h-80" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {trustItems.map((item) => (
          <div key={item} className="rounded-2xl border border-[#e6dcc8] bg-white px-3 py-3 text-center text-xs font-semibold text-[#5f4a3c] sm:text-sm">{item}</div>
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black text-[#4d382b]">دسته‌بندی‌های محبوب</h2>
          <Link href="/categories" className="text-sm font-bold text-[#667744]">مشاهده همه</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.title} href={cat.href} className="group overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={cat.image} alt={cat.title} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-[#5a3e2b]">{cat.title}</h3>
                <p className="mt-1 text-sm text-[#6e5847]">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black text-[#4d382b]">محصولات پرفروش</h2>
          <Link href="/products" className="text-sm font-bold text-[#667744]">مشاهده همه محصولات</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {bestSellers.map((p) => (
            <article key={p.name} className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white shadow-sm transition hover:shadow-lg">
              <img src={p.image} alt={p.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-[#5a3e2b]">{p.name}</h3>
                  <span className="rounded-full bg-[#f6f1e3] px-2 py-1 text-xs font-bold text-[#7d633f]">⭐ {p.rating}</span>
                </div>
                <p className="text-sm text-[#6e5847]">{p.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="font-black text-[#667744]">{p.sale} تومان</span>
                  <span className="text-[#9b8b79] line-through">{p.price}</span>
                </div>
                <div className="mt-2 text-xs font-semibold text-[#7b5e3b]">وضعیت: {p.stock}</div>
                <button className="mt-4 w-full rounded-xl bg-[#667744] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105">افزودن به سبد خرید</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm">
          <img src="https://images.unsplash.com/photo-1505576399279-565b52d4ac71" alt="روغن‌های تازه" className="h-56 w-full object-cover" />
          <div className="p-6">
            <h3 className="text-2xl font-black text-[#4d382b]">بخش ویژه روغن‌های تازه</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f4a3c]">تازه‌گیری روزانه با دستگاه پرس سرد، بدون افزودنی و مناسب برای مصرف روزانه خانواده.</p>
            <Link href="/products?category=oils" className="mt-4 inline-block rounded-xl border border-[#bfa886] bg-[#fbf6ea] px-5 py-2.5 font-bold text-[#5a3e2b]">مشاهده روغن‌ها</Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-[#e6dcc8] bg-white shadow-sm">
          <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d" alt="ادویه‌های محبوب" className="h-56 w-full object-cover" />
          <div className="p-6">
            <h3 className="text-2xl font-black text-[#4d382b]">ادویه‌های محبوب و پرفروش</h3>
            <p className="mt-2 text-sm leading-7 text-[#5f4a3c]">انتخاب تخصصی ادویه‌های تازه و معطر برای طعمی اصیل در آشپزی روزمره و حرفه‌ای.</p>
            <Link href="/products?category=spices" className="mt-4 inline-block rounded-xl border border-[#bfa886] bg-[#fbf6ea] px-5 py-2.5 font-bold text-[#5a3e2b]">مشاهده ادویه‌ها</Link>
          </div>
        </article>
      </section>

      <section className="mt-12 rounded-3xl border border-[#d6c299] bg-gradient-to-r from-[#677847] to-[#788b57] p-7 text-white">
        <p className="text-sm text-[#f7ebd1]">تخفیف ویژه این هفته</p>
        <h3 className="mt-1 text-3xl font-black">تا ۲۵٪ تخفیف روی منتخب روغن‌ها و ادویه‌ها</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/90">فقط تا پایان هفته فرصت دارید محصولات طبیعی و تازه را با قیمت ویژه تهیه کنید.</p>
        <Link href="/products" className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-bold text-[#5f7041]">خرید با تخفیف</Link>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black text-[#4d382b]">چرا از ما خرید کنید؟</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['تضمین کیفیت واقعی', 'ارسال سریع و پیگیری سفارش', 'بسته‌بندی بهداشتی', 'مشاوره تخصصی قبل خرید'].map((item) => (
            <div key={item} className="rounded-2xl border border-[#e6dcc8] bg-white p-4 text-sm font-semibold text-[#5f4a3c] shadow-sm">{item}</div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-black text-[#4d382b]">نظرات مشتریان</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <article key={t.name} className="rounded-2xl border border-[#e6dcc8] bg-white p-5 shadow-sm">
              <p className="text-sm text-amber-600">★★★★★</p>
              <p className="mt-2 text-sm leading-7 text-[#5f4a3c]">{t.text}</p>
              <p className="mt-3 font-bold text-[#5a3e2b]">{t.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black text-[#4d382b]">بلاگ آموزشی</h2>
          <Link href="/blog/identify-original-oil" className="text-sm font-bold text-[#667744]">مشاهده همه</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {blogPosts.map((post) => (
            <Link key={post.title} href={post.href} className="rounded-2xl border border-[#e6dcc8] bg-white p-5 shadow-sm transition hover:shadow-md">
              <h3 className="font-bold text-[#5a3e2b]">{post.title}</h3>
              <p className="mt-2 text-sm text-[#6e5847]">مطالعه مقاله و نکات کاربردی</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-14 rounded-3xl border border-[#d9c9ab] bg-[#f8f2e5] p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="font-black text-[#5a3e2b]">عصاره طبیعت</h4>
            <p className="mt-2 text-sm leading-7 text-[#5f4a3c]">فروشگاه تخصصی روغن‌های طبیعی، ادویه‌های اصیل و محصولات سالم عصاری.</p>
          </div>
          <div>
            <h4 className="font-black text-[#5a3e2b]">دسترسی سریع</h4>
            <ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>خانه</li><li>محصولات</li><li>دسته‌بندی‌ها</li><li>بلاگ</li></ul>
          </div>
          <div>
            <h4 className="font-black text-[#5a3e2b]">پشتیبانی</h4>
            <ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>سوالات متداول</li><li>شرایط بازگشت کالا</li><li>راهنمای خرید</li><li>حریم خصوصی</li></ul>
          </div>
          <div>
            <h4 className="font-black text-[#5a3e2b]">اطلاعات تماس</h4>
            <ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>۰۲۱-۱۲۳۴۵۶۷۸</li><li>تهران، بازار گیاهان دارویی</li><li>شنبه تا پنج‌شنبه ۹ تا ۲۱</li></ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
