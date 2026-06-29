'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, LayoutGrid, Package, Save, Shield, Sparkles, Truck } from 'lucide-react';
import { Section } from './Section';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { EditableHtml, EditableImage, EditableText } from '@/components/cms/EditableContent';
import {
  HOME_PRODUCT_FILTERS,
  HOME_PRODUCT_FILTER_LABELS,
  HOME_SECTION_DESIGNS,
  type HomeProductSectionConfig
} from '@/lib/shop/home-product-sections';

const featureItems = [
  { icon: Leaf, title: '۱۰۰٪ طبیعی', text: 'بدون افزودنی مصنوعی', color: 'from-emerald-500/15 to-emerald-600/5' },
  { icon: Shield, title: 'ضمانت اصالت', text: 'منشأ مشخص و شفاف', color: 'from-brand-500/15 to-brand-600/5' },
  { icon: Package, title: 'بسته‌بندی بهداشتی', text: 'استاندارد نگهداری', color: 'from-sky-500/15 to-sky-600/5' },
  { icon: Truck, title: 'ارسال مطمئن', text: 'سراسر کشور', color: 'from-violet-500/15 to-violet-600/5' }
];

export function HomeAboutEditable() {
  const { content, patchContent, editMode, isAdmin } = useSiteContent();
  const home = content.home;
  const saveHome = (field: keyof typeof home, value: string) =>
    patchContent({ home: { ...home, [field]: value } });

  return (
    <Section bg="white" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-amber-100/50 blur-3xl" />
      <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="group relative overflow-hidden rounded-[2rem] border border-surface-200 bg-surface-100 shadow-card">
          <EditableImage
            src={home.aboutImage}
            alt="درباره ما"
            onSave={(v) => saveHome('aboutImage', v)}
            label="ویرایش تصویر بخش درباره"
            imgClassName="aspect-[5/4] w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </div>
        <div>
          <EditableText value={home.aboutLabel} onSave={(v) => saveHome('aboutLabel', v)} className="site-label mb-3 block" as="p" label="برچسب درباره" />
          <EditableText value={home.aboutTitle} onSave={(v) => saveHome('aboutTitle', v)} className="site-heading block" as="h2" label="عنوان درباره" />
          <div className="mt-5 text-surface-600">
            <EditableHtml html={home.aboutHtml} onSave={(v) => saveHome('aboutHtml', v)} label="متن درباره ما" />
          </div>
          {editMode && isAdmin ? (
            <EditableText value={home.aboutCtaLabel} onSave={(v) => saveHome('aboutCtaLabel', v)} as="span" label="متن دکمه" className="site-btn-primary mt-8 inline-flex shadow-lg shadow-brand-600/20" />
          ) : (
            <Link href="/products" className="site-btn-primary mt-8 inline-flex shadow-lg shadow-brand-600/20">{home.aboutCtaLabel}</Link>
          )}
        </div>
      </div>
    </Section>
  );
}

export function HomeFeaturesEditable() {
  const { content, patchContent } = useSiteContent();
  const home = content.home;
  const saveHome = (field: keyof typeof home, value: string) =>
    patchContent({ home: { ...home, [field]: value } });

  return (
    <Section bg="brand" className="relative">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-bold text-brand-700">
          <Sparkles className="h-3.5 w-3.5" />
          <EditableText value={home.featuresLabel} onSave={(v) => saveHome('featuresLabel', v)} as="span" label="برچسب ویژگی‌ها" />
        </div>
        <EditableText value={home.featuresTitle} onSave={(v) => saveHome('featuresTitle', v)} className="site-heading block" as="h2" label="عنوان ویژگی‌ها" />
        <div className="mx-auto mt-4 max-w-2xl text-surface-600">
          <EditableHtml html={home.featuresHtml} onSave={(v) => saveHome('featuresHtml', v)} label="توضیح ویژگی‌ها" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featureItems.map((item) => (
          <div
            key={item.title}
            className={`rounded-2xl border border-white/60 bg-gradient-to-br ${item.color} p-6 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-card`}
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
              <item.icon className="h-5 w-5 text-brand-600" />
            </div>
            <h3 className="mt-4 font-bold text-surface-900">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-surface-600">{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

const designPreview: Record<string, string> = {
  classic: 'border-amber-300 bg-gradient-to-br from-slate-50 to-amber-50',
  minimal: 'border-slate-300 bg-white',
  accent: 'border-orange-300 bg-gradient-to-br from-amber-100 to-orange-50'
};

export function HomeProductSectionsEditable() {
  const router = useRouter();
  const { content, patchContent, editMode, isAdmin } = useSiteContent();
  const [draft, setDraft] = useState<HomeProductSectionConfig[]>(content.home.productSections);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(content.home.productSections);
  }, [content.home.productSections]);

  if (!editMode || !isAdmin) return null;

  const updateSection = (index: number, patch: Partial<HomeProductSectionConfig>) => {
    setDraft((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const ok = await patchContent({ home: { ...content.home, productSections: draft } });
    setSaving(false);
    if (!ok) {
      setError('ذخیره ناموفق بود. دوباره تلاش کنید.');
      return;
    }
    setMessage('بخش‌های محصولات ذخیره شد.');
    router.refresh();
  };

  return (
    <Section bg="white" className="border-y-2 border-dashed border-amber-300 bg-gradient-to-b from-amber-50/80 to-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-200">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-900">ویرایش بخش‌های محصولات</h3>
            <p className="text-xs text-slate-500">۳ باکس اسلایدر — پس از ذخیره، عنوان و فیلترها بلافاصله اعمال می‌شوند</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {draft.map((sec, i) => (
          <div
            key={sec.id}
            className={`overflow-hidden rounded-2xl border-2 shadow-sm transition ${designPreview[sec.design] || designPreview.classic}`}
          >
            <div className="border-b border-black/5 bg-white/60 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={sec.enabled}
                  onChange={(e) => updateSection(i, { enabled: e.target.checked })}
                  className="accent-amber-600"
                />
                باکس {i + 1} — {sec.enabled ? 'فعال' : 'غیرفعال'}
              </label>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">برچسب کوچک</label>
                <input
                  className="h-10 w-full rounded-xl border border-white/80 bg-white/90 px-3 text-sm shadow-inner"
                  value={sec.label}
                  onChange={(e) => updateSection(i, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">عنوان بخش</label>
                <input
                  className="h-10 w-full rounded-xl border border-white/80 bg-white/90 px-3 text-sm font-bold shadow-inner"
                  value={sec.title}
                  onChange={(e) => updateSection(i, { title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">فیلتر محصولات</label>
                <select
                  className="h-10 w-full rounded-xl border border-white/80 bg-white/90 px-3 text-sm"
                  value={sec.filterType}
                  onChange={(e) => updateSection(i, { filterType: e.target.value as HomeProductSectionConfig['filterType'] })}
                >
                  {HOME_PRODUCT_FILTERS.map((f) => (
                    <option key={f} value={f}>{HOME_PRODUCT_FILTER_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">سبک نمایش</label>
                <select
                  className="h-10 w-full rounded-xl border border-white/80 bg-white/90 px-3 text-sm"
                  value={sec.design}
                  onChange={(e) => updateSection(i, { design: e.target.value as HomeProductSectionConfig['design'] })}
                >
                  {HOME_SECTION_DESIGNS.map((d) => (
                    <option key={d} value={d}>
                      {d === 'classic' ? 'کلاسیک — خط طلایی' : d === 'minimal' ? 'مینیمال — ساده و تمیز' : 'اکسنت — گرادیان و درخشان'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-500">تعداد در اسلایدر ({sec.limit})</label>
                <input
                  type="range"
                  min={4}
                  max={24}
                  value={sec.limit}
                  onChange={(e) => updateSection(i, { limit: Number(e.target.value) })}
                  className="w-full accent-amber-600"
                />
              </div>
              <div className="rounded-xl bg-black/5 px-3 py-2 text-[11px] text-slate-600">
                <Sparkles className="mb-1 inline h-3.5 w-3.5 text-amber-600" />
                پیش‌نمایش: {sec.title || '—'} · {HOME_PRODUCT_FILTER_LABELS[sec.filterType]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
