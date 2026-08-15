'use client';

import { useEffect, useState } from 'react';
import { FileText, Hash, Layers, Tag, User } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminImageUploader,
  AdminMediaUploader,
  AdminPageHeader,
  AdminPagination,
  AdminPrimaryButton,
  AdminProTable,
  AdminRichTextEditor,
  FieldLabel,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import { useAdminList } from '@/hooks/useAdminList';
import type { GalleryMediaItem } from '@/lib/media/gallery';

type Post = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  content: string;
  category?: string;
  tags?: string[];
  author?: string;
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  isPublished: boolean;
  publishedAt?: string;
  media?: GalleryMediaItem[];
};

const initialForm = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  coverImage: '',
  content: '',
  category: 'روغن‌های طبیعی',
  tags: '',
  author: 'تیم محتوای نابسرا',
  seoMetaTitle: '',
  seoMetaDescription: '',
  isPublished: true,
  media: [] as GalleryMediaItem[]
};

export default function AdminBlogPage() {
  const { items, page, setPage, search, setSearch, totalPages, total, loading, error, reload } = useAdminList<Post>('/api/admin/blog');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => setForm(initialForm);

  const save = async () => {
    setFormError('');
    setMessage('');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        coverImage: form.coverImage,
        content: form.content,
        category: form.category.trim(),
        tags: form.tags.split(',').map((x) => x.trim()).filter(Boolean),
        author: form.author.trim(),
        seoMetaTitle: form.seoMetaTitle.trim(),
        seoMetaDescription: form.seoMetaDescription.trim(),
        isPublished: form.isPublished,
        media: form.media
      };
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `/api/admin/blog/${form.id}` : '/api/admin/blog';
      const { ok, error: saveError } = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!ok) {
        setFormError(saveError);
        return;
      }
      setMessage(form.id ? 'مقاله با موفقیت ویرایش شد.' : 'مقاله با موفقیت ایجاد شد.');
      resetForm();
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'خطا در ذخیره مقاله');
    } finally {
      setSaving(false);
    }
  };

  const editItem = (p: Post) => {
    setFormError('');
    setMessage('');
    setForm({
      id: p._id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      coverImage: p.coverImage || '',
      content: p.content,
      category: p.category || '',
      tags: (p.tags || []).join(', '),
      author: p.author || '',
      seoMetaTitle: p.seoMetaTitle || '',
      seoMetaDescription: p.seoMetaDescription || '',
      isPublished: p.isPublished,
      media: p.media || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async (id: string) => {
    if (!confirm('این مقاله حذف شود؟')) return;
    const { ok, error: deleteError } = await adminFetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (!ok) setFormError(deleteError);
    else {
      setMessage('مقاله حذف شد.');
      reload();
    }
  };

  return (
    <main className="space-y-6">
      <AdminPageHeader title="مدیریت بلاگ" description="ایجاد، ویرایش و انتشار مقالات با ویرایشگر متنی پیشرفته" />

      <AdminCard title={form.id ? 'ویرایش مقاله' : 'ایجاد مقاله جدید'}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><FieldLabel text="عنوان" /><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><FieldLabel text="اسلاگ" /><TextInput value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" className="text-right" /></div>
          <div><FieldLabel text="دسته‌بندی" /><TextInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><FieldLabel text="نویسنده" /><TextInput value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel text="برچسب‌ها (با کاما)" /><TextInput value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div className="md:col-span-2"><FieldLabel text="خلاصه کوتاه" /><TextInput value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
          <div><FieldLabel text="Meta Title" /><TextInput value={form.seoMetaTitle} onChange={(e) => setForm({ ...form, seoMetaTitle: e.target.value })} /></div>
          <div><FieldLabel text="Meta Description" /><TextInput value={form.seoMetaDescription} onChange={(e) => setForm({ ...form, seoMetaDescription: e.target.value })} /></div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminImageUploader
              label="تصویر شاخص"
              folder="blog"
              value={form.coverImage ? [form.coverImage] : []}
              onChange={(urls) => setForm({ ...form, coverImage: urls[0] || '' })}
              multiple={false}
              maxFiles={1}
              hint="تصویر اصلی مقاله در صفحه بلاگ نمایش داده می‌شود."
            />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminMediaUploader
              label="گالری مقاله (تصویر و ویدیو)"
              folder="blog"
              value={form.media}
              onChange={(media) => setForm({ ...form, media })}
              maxFiles={10}
              hint="رسانه‌های گالری مقاله — تصویر و ویدیو در کنار هم."
            />
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <AdminRichTextEditor
              label="متن کامل مقاله"
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              uploadFolder="blog"
              minHeight={360}
            />
          </div>
          <AdminCheckbox label="منتشر شود" checked={form.isPublished} onChange={(isPublished) => setForm({ ...form, isPublished })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <AdminPrimaryButton onClick={save} disabled={saving}>
            {saving ? 'در حال ذخیره...' : form.id ? 'ذخیره تغییرات' : 'ایجاد مقاله'}
          </AdminPrimaryButton>
          {form.id ? (
            <button type="button" onClick={resetForm} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">
              انصراف
            </button>
          ) : null}
        </div>
        {formError ? <div className="mt-3"><AdminAlert tone="error">{formError}</AdminAlert></div> : null}
        {message ? <div className="mt-3"><AdminAlert tone="success">{message}</AdminAlert></div> : null}
      </AdminCard>

      <AdminCard title="لیست مقالات">
        {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
        <AdminProTable
          data={items}
          loading={loading}
          rowKey={(p) => p._id}
          searchPlaceholder="جستجو در عنوان، دسته، نویسنده..."
          query={search}
          onQueryChange={setSearch}
          serverSearch
          totalCount={total}
          columns={[
            {
              id: 'cover',
              header: 'تصویر',
              icon: <Layers className="h-3.5 w-3.5" />,
              type: 'images',
              accessor: (p) => (p.coverImage ? [p.coverImage] : []),
              sortable: false,
              searchable: false,
              width: '90px'
            },
            {
              id: 'title',
              header: 'عنوان',
              icon: <FileText className="h-3.5 w-3.5" />,
              accessor: (p) => p.title,
              sortable: true,
              searchable: true
            },
            {
              id: 'category',
              header: 'دسته',
              icon: <Tag className="h-3.5 w-3.5" />,
              accessor: (p) => p.category || '-',
              sortable: true
            },
            {
              id: 'author',
              header: 'نویسنده',
              icon: <User className="h-3.5 w-3.5" />,
              accessor: (p) => p.author || '-'
            },
            {
              id: 'slug',
              header: 'اسلاگ',
              icon: <Hash className="h-3.5 w-3.5" />,
              type: 'ltr',
              accessor: (p) => p.slug
            },
            {
              id: 'isPublished',
              header: 'وضعیت',
              type: 'badge',
              accessor: (p) => p.isPublished,
              badge: (p) => ({ label: p.isPublished ? 'منتشر شده' : 'پیش‌نویس', tone: p.isPublished ? 'success' : 'neutral' }),
              sortable: true
            },
            {
              id: 'publishedAt',
              header: 'تاریخ انتشار',
              type: 'date',
              accessor: (p) => p.publishedAt || ''
            }
          ]}
          actions={[
            { id: 'edit', label: 'ویرایش', icon: 'edit', tone: 'primary', onClick: editItem },
            { id: 'delete', label: 'حذف', icon: 'delete', tone: 'danger', onClick: (p) => removeItem(p._id) }
          ]}
        />
        <AdminPagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
      </AdminCard>
    </main>
  );
}
