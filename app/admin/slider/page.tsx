'use client';

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminSingleImageUploader,
  FieldLabel,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import type { HeroSlide, HeroSliderConfig } from '@/lib/admin/slider-config';
import { defaultSliderConfig } from '@/lib/admin/slider-config';

const emptySlide = (): HeroSlide => ({
  badge: 'عطاری آنلاین',
  title: '',
  subtitle: '',
  image: '',
  ctaText: 'مشاهده محصولات',
  ctaLink: '/products'
});

export default function AdminSliderPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [autoplayInterval, setAutoplayInterval] = useState(6000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { ok, data, error: fetchError } = await adminFetch<{ slides?: HeroSlide[]; autoplayInterval?: number }>(
      '/api/admin/settings/slider'
    );
    if (!ok) {
      setError(fetchError);
      setSlides(defaultSliderConfig.slides);
      setAutoplayInterval(defaultSliderConfig.autoplayInterval ?? 6000);
    } else {
      const cfg: HeroSliderConfig = Array.isArray(data.slides)
        ? { slides: data.slides, autoplayInterval: data.autoplayInterval }
        : (data as unknown as HeroSliderConfig);
      setSlides(cfg.slides?.length ? cfg.slides : defaultSliderConfig.slides);
      setAutoplayInterval(cfg.autoplayInterval || 6000);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const moveSlide = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    const invalid = slides.find((s) => !s.title.trim() || !s.image.trim());
    if (invalid) {
      setMessage('عنوان و تصویر هر اسلاید الزامی است.');
      return;
    }
    setSaving(true);
    setMessage('');
    const { ok, error: saveError } = await adminFetch('/api/admin/settings/slider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides, autoplayInterval })
    });
    setSaving(false);
    setMessage(ok ? 'اسلایدر با موفقیت ذخیره شد.' : saveError || 'ذخیره ناموفق بود.');
  };

  return (
    <main>
      <AdminPageHeader
        title="اسلایدر صفحه اصلی"
        description="مدیریت اسلایدهای هیرو — تصویر، متن و دکمه‌ها را ویرایش کنید"
      />

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone={message.includes('موفق') ? 'success' : 'info'}>{message}</AdminAlert> : null}

      <AdminCard title="تنظیمات پخش">
        <div className="max-w-xs">
          <FieldLabel text="فاصله پخش خودکار (ثانیه)" />
          <TextInput
            type="number"
            min={3}
            max={30}
            value={String(Math.round(autoplayInterval / 1000))}
            onChange={(e) => setAutoplayInterval(Math.max(3000, Number(e.target.value || 6) * 1000))}
          />
        </div>
      </AdminCard>

      {loading ? (
        <p className="text-sm text-slate-500">در حال بارگذاری...</p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <AdminCard
              key={index}
              title={`اسلاید ${index + 1}${slide.title ? ` — ${slide.title}` : ''}`}
              actions={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSlide(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg border p-1.5 text-slate-600 disabled:opacity-30"
                    aria-label="بالا"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(index, 1)}
                    disabled={index === slides.length - 1}
                    className="rounded-lg border p-1.5 text-slate-600 disabled:opacity-30"
                    aria-label="پایین"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    disabled={slides.length <= 1}
                    className="rounded-lg border border-rose-200 p-1.5 text-rose-600 disabled:opacity-30"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              }
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <FieldLabel text="برچسب کوچک (badge)" />
                    <TextInput
                      value={slide.badge || ''}
                      onChange={(e) => updateSlide(index, { badge: e.target.value })}
                      placeholder="مثلاً: عطاری آنلاین"
                    />
                  </div>
                  <div>
                    <FieldLabel text="عنوان اصلی" />
                    <TextInput
                      value={slide.title}
                      onChange={(e) => updateSlide(index, { title: e.target.value })}
                      placeholder="عنوان اسلاید"
                    />
                  </div>
                  <div>
                    <FieldLabel text="زیرعنوان" />
                    <TextInput
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                      placeholder="توضیح کوتاه"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel text="متن دکمه" />
                      <TextInput
                        value={slide.ctaText}
                        onChange={(e) => updateSlide(index, { ctaText: e.target.value })}
                      />
                    </div>
                    <div>
                      <FieldLabel text="لینک دکمه" />
                      <TextInput
                        dir="ltr"
                        className="text-left"
                        value={slide.ctaLink}
                        onChange={(e) => updateSlide(index, { ctaLink: e.target.value })}
                        placeholder="/products"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <AdminSingleImageUploader
                    label="تصویر پس‌زمینه"
                    folder="banners"
                    value={slide.image}
                    onChange={(url) => updateSlide(index, { image: url })}
                    hint="نسبت تصویر ۱۶:۹ یا عریض‌تر پیشنهاد می‌شود"
                  />
                  {slide.image ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                      <img src={slide.image} alt="" className="aspect-[21/9] w-full object-cover" />
                    </div>
                  ) : (
                    <div className="mt-3 flex aspect-[21/9] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setSlides((prev) => [...prev, emptySlide()])}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          افزودن اسلاید
        </button>
        <AdminPrimaryButton onClick={save} disabled={saving || loading}>
          <Save className="h-4 w-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره اسلایدر'}
        </AdminPrimaryButton>
      </div>
    </main>
  );
}
