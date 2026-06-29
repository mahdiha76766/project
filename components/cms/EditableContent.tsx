'use client';

import { useState, type ReactNode } from 'react';
import { Check, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { ProRichTextEditor } from '@/components/cms/ProRichTextEditor';
import { RichHtmlContent } from '@/components/shop/RichHtmlContent';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { adminFetch } from '@/lib/admin/client';
import { resolveImage } from '@/lib/shop/resolve-image';
import { cn } from '@/lib/utils/cn';

function EditModal({
  title,
  onClose,
  onSave,
  children
}: {
  title: string;
  onClose: () => void;
  onSave: () => Promise<boolean>;
  children: ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    const ok = await onSave();
    setSaving(false);
    if (ok) onClose();
    else setError('ذخیره ناموفق بود.');
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-200 bg-gradient-to-l from-brand-50 to-white px-4 py-3">
          <h3 className="text-sm font-black text-surface-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {error ? <p className="px-4 text-xs text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-surface-200 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 text-sm font-bold text-surface-600">انصراف</button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            ذخیره و انتشار
          </button>
        </div>
      </div>
    </div>
  );
}

function EditableZone({
  children,
  onEdit,
  label,
  className,
  block = false
}: {
  children: ReactNode;
  onEdit: () => void;
  label: string;
  className?: string;
  block?: boolean;
}) {
  const { isAdmin, editMode } = useSiteContent();
  const clickable = isAdmin && editMode;

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={
        clickable
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }
          : undefined
      }
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onEdit(); } : undefined}
      title={clickable ? label : undefined}
      className={cn(
        className,
        block ? 'block w-full' : 'inline',
        clickable && 'editable-zone cursor-pointer rounded-xl transition hover:shadow-[inset_0_0_0_2px_rgba(245,158,11,0.55)]'
      )}
    >
      {children}
    </div>
  );
}

type EditableTextProps = {
  value: string;
  onSave: (value: string) => Promise<boolean>;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3';
  multiline?: boolean;
  label?: string;
};

export function EditableText({
  value,
  onSave,
  className,
  as: Tag = 'span',
  multiline = false,
  label = 'ویرایش متن'
}: EditableTextProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setOpen(true);
  };

  return (
    <>
      <EditableZone onEdit={start} label={label} className={className} block={Tag !== 'span'}>
        <Tag className={Tag !== 'span' ? className : undefined}>{value}</Tag>
      </EditableZone>
      {open ? (
        <EditModal title={label} onClose={() => setOpen(false)} onSave={async () => onSave(draft.trim())}>
          {multiline ? (
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          ) : (
            <input value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          )}
        </EditModal>
      ) : null}
    </>
  );
}

export function EditableHtml({
  html,
  onSave,
  className,
  label = 'ویرایش محتوا',
  uploadFolder = 'banners' as 'products' | 'blog' | 'banners'
}: {
  html: string;
  onSave: (html: string) => Promise<boolean>;
  className?: string;
  label?: string;
  uploadFolder?: 'products' | 'blog' | 'banners';
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(html);

  return (
    <>
      <EditableZone onEdit={() => { setDraft(html); setOpen(true); }} label={label} className={className} block>
        <RichHtmlContent html={html} />
      </EditableZone>
      {open ? (
        <EditModal title={label} onClose={() => setOpen(false)} onSave={async () => onSave(draft)}>
          <ProRichTextEditor value={draft} onChange={setDraft} minHeight={360} uploadFolder={uploadFolder} />
        </EditModal>
      ) : null}
    </>
  );
}

export function EditableImage({
  src,
  alt,
  onSave,
  label = 'ویرایش تصویر',
  className,
  imgClassName
}: {
  src: string;
  alt: string;
  onSave: (url: string) => Promise<boolean>;
  label?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(src);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'banners');
    const { ok, data } = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (ok && data.url) setDraft(data.url);
  };

  return (
    <>
      <EditableZone onEdit={() => { setDraft(src); setOpen(true); }} label={label} className={className} block>
        <img src={resolveImage(src)} alt={alt} className={imgClassName} />
      </EditableZone>
      {open ? (
        <EditModal title={label} onClose={() => setOpen(false)} onSave={async () => onSave(draft.trim())}>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-surface-200">
              <img src={resolveImage(draft)} alt="" className="max-h-64 w-full object-cover" />
            </div>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              dir="ltr"
              placeholder="https://... یا /uploads/banners/..."
              className="w-full rounded-xl border border-surface-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              آپلود تصویر جدید
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
            </label>
            <p className="flex items-center gap-1 text-xs text-surface-500"><ImageIcon className="h-3.5 w-3.5" /> می‌توانید URL خارجی یا فایل آپلودشده وارد کنید.</p>
          </div>
        </EditModal>
      ) : null}
    </>
  );
}
