import { FEEDAR_PRODUCT_LINE_LIST } from '@/lib/brand/feedar';

export function FpFilterSidebar({
  categories,
  defaults,
  action = '/products'
}: {
  categories: Array<{ slug: string; name: string }>;
  defaults: { q?: string; category?: string; sort?: string; line?: string };
  action?: string;
}) {
  return (
    <form action={action} className="fp-card p-5">
      <h2 className="text-sm font-bold text-surface-900">فیلتر محصولات</h2>
      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="product-q" className="mb-1.5 block text-xs font-medium text-surface-500">
            جستجو
          </label>
          <input id="product-q" name="q" defaultValue={defaults.q} placeholder="نام محصول" className="fp-input" />
        </div>
        <div>
          <label htmlFor="product-line" className="mb-1.5 block text-xs font-medium text-surface-500">
            خط محصول
          </label>
          <select id="product-line" name="line" defaultValue={defaults.line || ''} className="fp-input">
            <option value="">همه خطوط</option>
            {FEEDAR_PRODUCT_LINE_LIST.map((line) => (
              <option key={line.code} value={line.code}>
                {line.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-category" className="mb-1.5 block text-xs font-medium text-surface-500">
            دسته‌بندی
          </label>
          <select id="product-category" name="category" defaultValue={defaults.category || ''} className="fp-input">
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="product-sort" className="mb-1.5 block text-xs font-medium text-surface-500">
            مرتب‌سازی
          </label>
          <select id="product-sort" name="sort" defaultValue={defaults.sort || 'newest'} className="fp-input">
            <option value="newest">جدیدترین</option>
            <option value="best_selling">منتخب</option>
            <option value="name">نام</option>
          </select>
        </div>
        <button type="submit" className="fp-btn-primary w-full">
          اعمال فیلتر
        </button>
      </div>
    </form>
  );
}
