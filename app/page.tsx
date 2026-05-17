import Link from 'next/link';
import { ProductCard } from '@/components/shop/ProductCard';
import { Section } from '@/components/shop/Section';
import { blogPosts, products, storeCategories, testimonials } from '@/lib/data/shop-data';

export default function Home() {
  const bestSellers = products.filter((p) => p.bestSeller);
  const featured = products.filter((p) => p.featured);
  const discounted = products.filter((p) => p.discountPrice);
  const freshPressed = products.filter((p) => p.freshPressed);
  const popularSpices = products.filter((p) => p.popularSpice);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-100 via-orange-50 to-lime-50 p-8 shadow-lg">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-2xl pulse-soft" />
        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-lime-200/50 blur-2xl pulse-soft" />
        <div className="relative z-10 grid items-center gap-6 md:grid-cols-2">
          <div>
            <span className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-800">تازه‌گیری روزانه • ارسال سریع</span>
            <h1 className="text-3xl font-black leading-tight text-amber-900 md:text-4xl">فروشگاه روغن، ادویه و محصولات عصاری</h1>
            <p className="mt-3 max-w-2xl text-slate-700">محصولات طبیعی، تازه و اصیل با طراحی تجربه خرید مدرن، سریع و مطمئن.</p>
            <div className="mt-5 flex gap-3">
              <Link href="/products" className="relative inline-block overflow-hidden rounded-xl bg-amber-800 px-5 py-3 text-white shine">مشاهده محصولات</Link>
              <Link href="/categories" className="inline-block rounded-xl border border-amber-400 bg-white px-5 py-3 text-amber-900">دسته‌بندی‌ها</Link>
            </div>
          </div>
          <div className="float-y rounded-2xl border border-white/70 bg-white/60 p-5 backdrop-blur">
            <p className="font-bold text-amber-900">پیشنهاد ویژه امروز</p>
            <p className="mt-2 text-sm text-slate-700">تا ۲۰٪ تخفیف روی روغن‌های تازه‌گیری‌شده + ارسال سریع سراسری.</p>
          </div>
        </div>
      </section>

      <Section title="دسته‌بندی‌های اصلی">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {storeCategories.map((cat) => <Link key={cat.slug} href={`/categories/${cat.slug}`} className="rounded-xl border bg-white p-4 transition hover:-translate-y-1 hover:shadow-md">{cat.name}</Link>)}
        </div>
      </Section>

      {[['محصولات پرفروش', bestSellers], ['محصولات ویژه', featured], ['محصولات تخفیف‌دار', discounted], ['روغن‌های تازه‌گیری‌شده', freshPressed], ['ادویه‌های محبوب', popularSpices]].map(([title, items]) => (
        <Section key={title} title={title as string}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{(items as typeof products).map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </Section>
      ))}

      <Section title="مزیت‌های خرید از فروشگاه">
        <ul className="grid gap-3 md:grid-cols-3"><li className="rounded-xl bg-white p-4">تضمین اصالت کالا</li><li className="rounded-xl bg-white p-4">پشتیبانی تخصصی</li><li className="rounded-xl bg-white p-4">ارسال سریع</li></ul>
      </Section>
      <Section title="نظرات مشتریان"><div className="grid gap-3 md:grid-cols-2">{testimonials.map((t) => <blockquote key={t.name} className="rounded-xl bg-white p-4">{t.text}<footer className="mt-2 text-sm">— {t.name}</footer></blockquote>)}</div></Section>
      <Section title="بلاگ آموزشی"><div className="grid gap-3 md:grid-cols-2">{blogPosts.map((b) => <Link key={b.slug} href={`/blog/${b.slug}`} className="rounded-xl bg-white p-4">{b.title}</Link>)}</div></Section>
      <Section title="سوالات متداول"><div className="space-y-2">{['آیا محصولات طبیعی هستند؟', 'ارسال چند روزه است؟'].map((f) => <details key={f} className="rounded-xl bg-white p-4"><summary>{f}</summary><p className="mt-2 text-sm text-slate-600">بله، تمام محصولات از تامین‌کنندگان معتبر تهیه می‌شوند.</p></details>)}</div></Section>

      <footer className="mt-10 rounded-2xl bg-amber-900 p-6 text-amber-50">© 2026 فروشگاه عصاره طبیعت</footer>
    </main>
  );
}
