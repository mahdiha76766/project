import { ProductCard } from '@/components/shop/ProductCard';
import { Section } from '@/components/shop/Section';
import { blogPosts, products, storeCategories, testimonials } from '@/lib/data/shop-data';
import Link from 'next/link';
import { HeroSlider } from '@/components/shop/HeroSlider';
import { getHeroSlides } from '@/lib/admin/slider-settings';

export default async function Home() {
  const slides = await getHeroSlides();
  const bestSellers = products.filter((p) => p.bestSeller);
  const featured = products.filter((p) => p.featured);
  const discounted = products.filter((p) => p.discountPrice);
  const freshPressed = products.filter((p) => p.freshPressed);
  const popularSpices = products.filter((p) => p.popularSpice);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <HeroSlider slides={slides} />

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
