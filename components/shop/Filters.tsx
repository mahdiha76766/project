import { storeCategories } from '@/lib/data/shop-data';

export const Filters = () => {
  return (
    <aside className="space-y-4 rounded-2xl border border-amber-100 bg-white p-4">
      <h3 className="font-bold text-amber-900">فیلترها</h3>
      <div>
        <label className="mb-1 block text-sm">جستجو</label>
        <input name="q" className="w-full rounded-lg border p-2" placeholder="نام محصول، دسته‌بندی، ویژگی..." />
      </div>
      <div>
        <label className="mb-1 block text-sm">دسته‌بندی</label>
        <select name="category" className="w-full rounded-lg border p-2">
          <option value="">همه</option>
          {storeCategories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm">مرتب‌سازی</label>
        <select name="sort" className="w-full rounded-lg border p-2">
          <option value="newest">جدیدترین</option>
          <option value="best_selling">پرفروش‌ترین</option>
          <option value="cheapest">ارزان‌ترین</option>
          <option value="expensive">گران‌ترین</option>
        </select>
      </div>
      <button className="w-full rounded-lg bg-amber-800 py-2 text-white">اعمال فیلتر</button>
    </aside>
  );
};
