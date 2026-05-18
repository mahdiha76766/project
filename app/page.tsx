import Link from 'next/link';
import { HeroSlider } from '@/components/shop/HeroSlider';
import { getHeroSlides } from '@/lib/admin/slider-settings';
import { Banner, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

const trustItems = ['ارسال سریع و مطمئن', 'ضمانت اصالت کالا', 'پشتیبانی واقعی خرید', 'مرجوعی تا ۷ روز'];

const categories = [
  { title: 'روغن‌های طبیعی', desc: 'پرس سرد و تازه‌گیری روز', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', href: '/products?category=oils' },
  { title: 'ادویه‌های اصیل', desc: 'عطر و طعم تازه ایرانی', image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f', href: '/products?category=spices' },
  { title: 'ارده و شیره', desc: 'مقوی و طبیعی', image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d', href: '/products?category=pastes-syrups' },
  { title: 'دمنوش و گیاهان', desc: 'آرامش‌بخش و سالم', image: 'https://images.unsplash.com/photo-1597481499666-3fef31a5f2c9', href: '/products?category=herbs' }
];

export default async function Home() {
  const heroSlides = await getHeroSlides();
  await connectToDatabase();
  const homeBanners = await Banner.find({ isActive: true, position: 'home' }).sort({ createdAt: -1 }).limit(3).lean();
  const bestSellers = await Product.find({ isActive: true }).sort({ isFeatured: -1, createdAt: -1 }).limit(4).lean();

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

      {homeBanners.length ? (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {homeBanners.map((b: any) => (
            <Link key={String(b._id)} href={b.link || '/'} className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white">
              <img src={b.image} alt={b.title} className="h-36 w-full object-cover" />
              <div className="p-3 text-sm font-bold text-[#5a3e2b]">{b.title}</div>
            </Link>
          ))}
        </section>
      ) : null}

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
          {bestSellers.map((p: any) => (
            <article key={String(p._id)} className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white shadow-sm transition hover:shadow-lg">
              <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03'} alt={p.name} className="h-44 w-full object-cover" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between"><h3 className="font-bold text-[#5a3e2b]">{p.name}</h3><span className="rounded-full bg-[#f6f1e3] px-2 py-1 text-xs font-bold text-[#7d633f]">⭐ {(p.isFeatured ? '5.0' : '4.8')}</span></div>
                <p className="text-sm text-[#6e5847]">{p.shortDescription}</p>
                <div className="mt-3 flex items-center gap-2 text-sm"><span className="font-black text-[#667744]">{(p.discountPrice ?? p.price).toLocaleString('fa-IR')} تومان</span>{p.discountPrice ? <span className="text-[#9b8b79] line-through">{p.price.toLocaleString('fa-IR')}</span> : null}</div>
                <div className="mt-2 text-xs font-semibold text-[#7b5e3b]">وضعیت: {p.stock > 0 ? 'موجود' : 'ناموجود'}</div>
                <Link href={`/products/${p.slug}`} className="mt-4 block w-full rounded-xl bg-[#667744] px-4 py-2.5 text-center text-sm font-bold text-white transition hover:brightness-105">مشاهده محصول</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
