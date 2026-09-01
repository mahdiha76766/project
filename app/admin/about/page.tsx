'use client';

import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminSingleImageUploader,
  FieldLabel,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { useAdminCms } from '@/hooks/useAdminCms';
import { useAdminToast } from '@/components/admin/AdminToast';

export default function AdminAboutPage() {
  const { content, setContent, loading, saving, error, message, save } = useAdminCms();
  const { notify } = useAdminToast();
  const about = content.about;

  return (
    <main className="space-y-6">
      <AdminPageHeader title="مدیریت درباره ما" description="ماموریت، چشم‌انداز، ارزش‌ها و آمار شرکت را از همین‌جا ویرایش کنید." />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
      <AdminCard title="محتوا">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><FieldLabel text="معرفی" /><TextArea value={about.introduction} onChange={(e) => setContent({ ...content, about: { ...about, introduction: e.target.value } })} /></div>
          <div><FieldLabel text="ماموریت" /><TextArea value={about.mission} onChange={(e) => setContent({ ...content, about: { ...about, mission: e.target.value } })} /></div>
          <div><FieldLabel text="چشم‌انداز" /><TextArea value={about.vision} onChange={(e) => setContent({ ...content, about: { ...about, vision: e.target.value } })} /></div>
          <div className="md:col-span-2"><FieldLabel text="تاریخچه / مسیر" /><TextArea value={about.history} onChange={(e) => setContent({ ...content, about: { ...about, history: e.target.value } })} /></div>
          <div>
            <FieldLabel text="ارزش‌ها (هر خط: عنوان|توضیح)" />
            <textarea className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm" value={about.valuesText} onChange={(e) => setContent({ ...content, about: { ...about, valuesText: e.target.value } })} />
          </div>
          <div>
            <FieldLabel text="آمار (هر خط: مقدار|برچسب)" />
            <textarea className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm" value={about.statsText} onChange={(e) => setContent({ ...content, about: { ...about, statsText: e.target.value } })} />
          </div>
          <div><FieldLabel text="عنوان SEO" /><TextInput value={about.seoTitle} onChange={(e) => setContent({ ...content, about: { ...about, seoTitle: e.target.value } })} /></div>
          <div><FieldLabel text="توضیح SEO" /><TextInput value={about.seoDescription} onChange={(e) => setContent({ ...content, about: { ...about, seoDescription: e.target.value } })} /></div>
          <div className="md:col-span-2">
            <AdminSingleImageUploader label="تصویر درباره ما" value={about.image} folder="media" onChange={(image) => setContent({ ...content, about: { ...about, image } })} />
          </div>
        </div>
      </AdminCard>
      <AdminPrimaryButton
        disabled={saving || loading}
        onClick={async () => {
          const ok = await save({ about });
          notify(ok ? 'صفحه درباره ما ذخیره شد.' : 'ذخیره ناموفق بود.', ok ? 'success' : 'error');
        }}
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </AdminPrimaryButton>
    </main>
  );
}
