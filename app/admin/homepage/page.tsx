'use client';

import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminRichTextEditor,
  AdminSingleImageUploader,
  FieldLabel,
  TextInput
} from '@/components/admin/ui';
import { useAdminCms } from '@/hooks/useAdminCms';
import { useAdminToast } from '@/components/admin/AdminToast';

export default function AdminHomepagePage() {
  const { content, setContent, loading, saving, error, message, save } = useAdminCms();
  const { notify } = useAdminToast();
  const home = content.home;

  return (
    <main className="space-y-6">
      <AdminPageHeader title="مدیریت صفحه اصلی" description="محتوای هیرو، معرفی شرکت، R&D و سازمان‌های مرتبط بدون تغییر کد." />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
      <AdminCard title="هیرو">
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel text="کیکر" /><TextInput value={home.heroKicker} onChange={(e) => setContent({ ...content, home: { ...home, heroKicker: e.target.value } })} /></div>
          <div><FieldLabel text="CTA اصلی" /><TextInput value={home.heroCtaPrimary} onChange={(e) => setContent({ ...content, home: { ...home, heroCtaPrimary: e.target.value } })} /></div>
          <div className="md:col-span-2"><FieldLabel text="عنوان" /><TextInput value={home.heroTitle} onChange={(e) => setContent({ ...content, home: { ...home, heroTitle: e.target.value } })} /></div>
          <div className="md:col-span-2"><FieldLabel text="توضیح" /><TextInput value={home.heroDescription} onChange={(e) => setContent({ ...content, home: { ...home, heroDescription: e.target.value } })} /></div>
          <div><FieldLabel text="CTA ثانویه" /><TextInput value={home.heroCtaSecondary} onChange={(e) => setContent({ ...content, home: { ...home, heroCtaSecondary: e.target.value } })} /></div>
          <div className="md:col-span-2">
            <AdminSingleImageUploader
              label="تصویر هیرو"
              value={home.heroImage}
              folder="media"
              onChange={(heroImage) => setContent({ ...content, home: { ...home, heroImage } })}
            />
          </div>
        </div>
      </AdminCard>
      <AdminCard title="معرفی و ویژگی‌ها">
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel text="برچسب معرفی" /><TextInput value={home.aboutLabel} onChange={(e) => setContent({ ...content, home: { ...home, aboutLabel: e.target.value } })} /></div>
          <div><FieldLabel text="عنوان معرفی" /><TextInput value={home.aboutTitle} onChange={(e) => setContent({ ...content, home: { ...home, aboutTitle: e.target.value } })} /></div>
          <div className="md:col-span-2"><AdminRichTextEditor label="متن معرفی" value={home.aboutHtml} onChange={(aboutHtml) => setContent({ ...content, home: { ...home, aboutHtml } })} /></div>
          <div><FieldLabel text="عنوان ویژگی‌ها" /><TextInput value={home.featuresTitle} onChange={(e) => setContent({ ...content, home: { ...home, featuresTitle: e.target.value } })} /></div>
          <div className="md:col-span-2"><AdminRichTextEditor label="متن ویژگی‌ها" value={home.featuresHtml} onChange={(featuresHtml) => setContent({ ...content, home: { ...home, featuresHtml } })} /></div>
        </div>
      </AdminCard>
      <AdminCard title="تحقیق و توسعه / شرکا / دعوت به اقدام">
        <div className="grid gap-4">
          <div><FieldLabel text="عنوان R&D" /><TextInput value={home.researchTitle} onChange={(e) => setContent({ ...content, home: { ...home, researchTitle: e.target.value } })} /></div>
          <AdminRichTextEditor label="متن R&D" value={home.researchHtml} onChange={(researchHtml) => setContent({ ...content, home: { ...home, researchHtml } })} />
          <AdminSingleImageUploader label="تصویر R&D" value={home.researchImage} folder="media" onChange={(researchImage) => setContent({ ...content, home: { ...home, researchImage } })} />
          <div><FieldLabel text="عنوان سازمان‌های مرتبط" /><TextInput value={home.partnersTitle} onChange={(e) => setContent({ ...content, home: { ...home, partnersTitle: e.target.value } })} /></div>
          <div>
            <FieldLabel text="سازمان‌ها (هر خط: نام|آدرس)" />
            <textarea className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm" value={home.partnersText} onChange={(e) => setContent({ ...content, home: { ...home, partnersText: e.target.value } })} />
          </div>
          <div><FieldLabel text="عنوان CTA" /><TextInput value={home.ctaTitle} onChange={(e) => setContent({ ...content, home: { ...home, ctaTitle: e.target.value } })} /></div>
          <AdminRichTextEditor label="متن دعوت به اقدام" value={home.ctaHtml} onChange={(ctaHtml) => setContent({ ...content, home: { ...home, ctaHtml } })} />
        </div>
      </AdminCard>
      <AdminPrimaryButton
        disabled={saving || loading}
        onClick={async () => {
          const ok = await save({ home });
          notify(ok ? 'صفحه اصلی ذخیره شد.' : 'ذخیره ناموفق بود.', ok ? 'success' : 'error');
        }}
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </AdminPrimaryButton>
    </main>
  );
}
