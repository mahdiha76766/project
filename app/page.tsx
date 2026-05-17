import Link from 'next/link';
import { products } from '@/lib/data/shop-data';

const trustItems = ['ارسال سریع', 'ضمانت اصالت', 'پرداخت امن', 'پشتیبانی خرید', 'بسته‌بندی بهداشتی'];

const categories = [
  { name: 'روغن‌ها', desc: 'پرس سرد و تازه‌گیری روز', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5' },
  { name: 'ادویه‌ها', desc: 'عطر و طعم اصیل', image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f' },
  { name: 'ارده و شیره', desc: 'مقوی و طبیعی', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d' },
  { name: 'دمنوش‌ها', desc: 'آرامش‌بخش و سالم', image: 'https://images.unsplash.com/photo-1597481499666-3fef31a5f2c9' },
  { name: 'گیاهان دارویی', desc: 'انتخاب تخصصی', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6' },
  { name: 'پک‌های هدیه', desc: 'زیبا و کاربردی', image: 'https://images.unsplash.com/photo-1514996937319-344454492b37' }
];

export default function Home() {
  const best = products.slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14">
      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-l from-[#fff9ef] via-[#f9f5ea] to-[#eef2e6] p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs text-olive-900">طبیعی • سالم • اصیل</p>
            <h1 className="text-3xl font-black leading-tight text-[#5a3e2b] md:text-5xl">روغن‌های طبیعی و ادویه‌های اصیل، مستقیم از عصاری</h1>
            <p className="mt-4 text-slate-700">کیفیت تضمین‌شده، تولید تازه، ارسال سریع و بسته‌بندی کاملاً بهداشتی برای خریدی امن و مطمئن.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="rounded-xl bg-[#667744] px-5 py-3 text-white">مشاهده محصولات</Link>
              <Link href="/products?category=oils" className="rounded-xl border border-[#c69a3a] bg-white px-5 py-3 text-[#5a3e2b]">خرید روغن‌های تازه</Link>
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

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between"><h2 className="text-2xl font-black text-[#5a3e2b]">دسته‌بندی‌های محبوب</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <article key={c.name} className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <img src={c.image} alt={c.name} className="h-40 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-[#5a3e2b]">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
                <button className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-[#5a3e2b]">مشاهده دسته</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl font-black text-[#5a3e2b]">محصولات پرفروش</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p) => (
            <article key={p.id} className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm">
              <div className="relative">
                <img src={p.images[0]} alt={p.name} className="h-44 w-full rounded-xl object-cover" />
                <span className="absolute right-2 top-2 rounded-full bg-[#667744] px-2 py-1 text-xs text-white">پرفروش</span>
              </div>
              <h3 className="mt-3 font-bold text-[#5a3e2b]">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{p.shortDescription}</p>
              <p className="mt-1 text-xs text-amber-700">★★★★★</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-black text-[#5a3e2b]">{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</span>
                {p.discountPrice ? <span className="text-xs text-slate-400 line-through">{p.price.toLocaleString('fa-IR')}</span> : null}
              </div>
              <p className="mt-1 text-xs text-emerald-700">{p.stock > 0 ? 'موجود در انبار' : 'ناموجود'}</p>
              <button className="mt-3 w-full rounded-xl bg-[#667744] py-2 text-sm text-white">افزودن به سبد خرید</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
