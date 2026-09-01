'use client';

import {
  AdminAlert,
  AdminCard,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminRichTextEditor,
  FieldLabel,
  TextInput
} from '@/components/admin/ui';
import { useAdminCms } from '@/hooks/useAdminCms';
import { useAdminToast } from '@/components/admin/AdminToast';

export default function AdminContactSettingsPage() {
  const { content, setContent, loading, saving, error, message, save } = useAdminCms();
  const { notify } = useAdminToast();
  const contact = content.contact;

  return (
    <main className="space-y-6">
      <AdminPageHeader title="اطلاعات تماس" description="آدرس، تلفن، ساعات کاری، شبکه‌های اجتماعی و مختصات نقشه." />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}
      <AdminCard title="ارتباط">
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel text="عنوان" /><TextInput value={contact.title} onChange={(e) => setContent({ ...content, contact: { ...contact, title: e.target.value } })} /></div>
          <div><FieldLabel text="زیرعنوان" /><TextInput value={contact.subtitle} onChange={(e) => setContent({ ...content, contact: { ...contact, subtitle: e.target.value } })} /></div>
          <div className="md:col-span-2"><AdminRichTextEditor label="متن صفحه تماس" value={contact.bodyHtml} onChange={(bodyHtml) => setContent({ ...content, contact: { ...contact, bodyHtml } })} /></div>
          <div><FieldLabel text="تلفن" /><TextInput value={contact.phone} onChange={(e) => setContent({ ...content, contact: { ...contact, phone: e.target.value } })} /></div>
          <div><FieldLabel text="ایمیل" /><TextInput value={contact.email} onChange={(e) => setContent({ ...content, contact: { ...contact, email: e.target.value } })} dir="ltr" /></div>
          <div className="md:col-span-2"><FieldLabel text="آدرس" /><TextInput value={contact.address} onChange={(e) => setContent({ ...content, contact: { ...contact, address: e.target.value } })} /></div>
          <div><FieldLabel text="ساعات کاری" /><TextInput value={contact.hours} onChange={(e) => setContent({ ...content, contact: { ...contact, hours: e.target.value } })} /></div>
          <div><FieldLabel text="عنوان نقشه" /><TextInput value={contact.mapTitle} onChange={(e) => setContent({ ...content, contact: { ...contact, mapTitle: e.target.value } })} /></div>
          <div><FieldLabel text="عرض جغرافیایی" /><TextInput value={String(contact.mapLat)} onChange={(e) => setContent({ ...content, contact: { ...contact, mapLat: Number(e.target.value) || 0 } })} dir="ltr" /></div>
          <div><FieldLabel text="طول جغرافیایی" /><TextInput value={String(contact.mapLng)} onChange={(e) => setContent({ ...content, contact: { ...contact, mapLng: Number(e.target.value) || 0 } })} dir="ltr" /></div>
          <div><FieldLabel text="تلگرام" /><TextInput value={contact.telegram} onChange={(e) => setContent({ ...content, contact: { ...contact, telegram: e.target.value } })} dir="ltr" /></div>
          <div><FieldLabel text="اینستاگرام" /><TextInput value={contact.instagram} onChange={(e) => setContent({ ...content, contact: { ...contact, instagram: e.target.value } })} dir="ltr" /></div>
          <div><FieldLabel text="واتساپ" /><TextInput value={contact.whatsapp} onChange={(e) => setContent({ ...content, contact: { ...contact, whatsapp: e.target.value } })} dir="ltr" /></div>
          <div><FieldLabel text="لینکدین" /><TextInput value={contact.linkedin} onChange={(e) => setContent({ ...content, contact: { ...contact, linkedin: e.target.value } })} dir="ltr" /></div>
        </div>
      </AdminCard>
      <AdminPrimaryButton
        disabled={saving || loading}
        onClick={async () => {
          const ok = await save({ contact });
          notify(ok ? 'اطلاعات تماس ذخیره شد.' : 'ذخیره ناموفق بود.', ok ? 'success' : 'error');
        }}
      >
        {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
      </AdminPrimaryButton>
    </main>
  );
}
