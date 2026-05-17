import Link from 'next/link';
import { HeroSlider } from '@/components/shop/HeroSlider';
import { getHeroSlides } from '@/lib/admin/slider-settings';

const trustItems = ['ارسال سریع و مطمئن', 'ضمانت اصالت کالا', 'پشتیبانی واقعی خرید', 'مرجوعی تا ۷ روز'];

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

export default async function Home() {
  const heroSlides = await getHeroSlides();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <section className="hero-text mt-6 overflow-hidden rounded-3xl shadow-[0_20px_60px_-35px_rgba(70,50,30,0.5)]">
        <HeroSlider slides={heroSlides} />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {trustItems.map((item) => (
          <div key={item} className="rounded-2xl border border-[#e6dcc8] bg-[#fffdf8] px-3 py-3 text-center text-xs font-semibold text-[#5f4a3c] sm:text-sm">{item}</div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl bg-[#f8f2e6] p-5 sm:p-6">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black text-[#4d382b]">دسته‌بندی‌های محبوب</h2>
          <Link href="/categories" className="text-sm font-bold text-[#667744]">مشاهده همه</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link key={cat.title} href={cat.href} className="group overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={cat.image} alt={cat.title} className="h-40 w-full object-cover" />
              <div className="p-4"><h3 className="font-bold text-[#5a3e2b]">{cat.title}</h3><p className="mt-1 text-sm text-[#6e5847]">{cat.desc}</p></div>
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
                <div className="mb-2 flex items-center justify-between"><h3 className="font-bold text-[#5a3e2b]">{p.name}</h3><span className="rounded-full bg-[#f6f1e3] px-2 py-1 text-xs font-bold text-[#7d633f]">⭐ {p.rating}</span></div>
                <p className="text-sm text-[#6e5847]">{p.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-sm"><span className="font-black text-[#667744]">{p.sale} تومان</span><span className="text-[#9b8b79] line-through">{p.price}</span></div>
                <div className="mt-2 text-xs font-semibold text-[#7b5e3b]">وضعیت: {p.stock}</div>
                <button className="mt-4 w-full rounded-xl bg-[#667744] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105">افزودن به سبد خرید</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-[#d6c299] bg-gradient-to-r from-[#677847] to-[#788b57] p-7 text-white">
        <p className="text-sm text-[#f7ebd1]">تخفیف ویژه این هفته</p>
        <h3 className="mt-1 text-3xl font-black">تا ۲۵٪ تخفیف روی منتخب روغن‌ها و ادویه‌ها</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/90">فقط تا پایان هفته فرصت دارید محصولات طبیعی و تازه را با قیمت ویژه تهیه کنید.</p>
        <Link href="/products" className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-bold text-[#5f7041]">خرید با تخفیف</Link>
      </section>

      <footer className="mt-14 rounded-3xl border border-[#d9c9ab] bg-[#f8f2e5] p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><h4 className="font-black text-[#5a3e2b]">عصاره طبیعت</h4><p className="mt-2 text-sm leading-7 text-[#5f4a3c]">فروشگاه تخصصی روغن‌های طبیعی، ادویه‌های اصیل و محصولات سالم عصاری.</p></div>
          <div><h4 className="font-black text-[#5a3e2b]">دسترسی سریع</h4><ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>خانه</li><li>محصولات</li><li>دسته‌بندی‌ها</li><li>بلاگ</li></ul></div>
          <div><h4 className="font-black text-[#5a3e2b]">پشتیبانی</h4><ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>سوالات متداول</li><li>شرایط بازگشت کالا</li><li>راهنمای خرید</li><li>حریم خصوصی</li></ul></div>
          <div><h4 className="font-black text-[#5a3e2b]">اطلاعات تماس</h4><ul className="mt-2 space-y-2 text-sm text-[#5f4a3c]"><li>۰۲۱-۱۲۳۴۵۶۷۸</li><li>تهران، بازار گیاهان دارویی</li><li>شنبه تا پنج‌شنبه ۹ تا ۲۱</li></ul></div>
        </div>
      </footer>
    </main>
  );
}
