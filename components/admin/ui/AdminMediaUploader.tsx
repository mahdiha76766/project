'use client';

import { useRef, useState } from 'react';
import { Film, ImagePlus, Loader2, Play, Trash2, Upload } from 'lucide-react';
import type { GalleryMediaItem } from '@/lib/media/gallery';
import { FieldLabel } from './AdminField';
import { adminFetch } from '@/lib/admin/client';
import { resolveImageUrl } from '@/lib/admin/table-formats';
import { cn } from '@/lib/utils/cn';

type AdminMediaUploaderProps = {
  label: string;
  folder: 'products' | 'categories' | 'blog' | 'banners' | 'media' | 'downloads';
  value: GalleryMediaItem[];
  onChange: (items: GalleryMediaItem[]) => void;
  maxFiles?: number;
  hint?: string;
  disabled?: boolean;
};

export function AdminMediaUploader({
  label,
  folder,
  value,
  onChange,
  maxFiles = 10,
  hint,
  disabled
}: AdminMediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    const remaining = maxFiles - value.length;
    const batch = list.slice(0, Math.max(remaining, 0));
    if (!batch.length) {
      setError(`حداکثر ${maxFiles.toLocaleString('fa-IR')} فایل مجاز است.`);
      return;
    }

    setUploading(true);
    setError('');
    const uploaded: GalleryMediaItem[] = [];

    for (const file of batch) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      fd.append('mode', 'media');
      const { ok, data, error: uploadError } = await adminFetch<{ url: string; type: 'image' | 'video' }>(
        '/api/admin/upload',
        { method: 'POST', body: fd }
      );
      if (!ok) {
        setError(uploadError);
        break;
      }
      uploaded.push({ type: data.type || 'image', url: data.url });
    }

    setUploading(false);
    if (uploaded.length) onChange([...value, ...uploaded].slice(0, maxFiles));
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const movePrimary = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  };

  return (
    <div>
      <FieldLabel text={label} />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed p-4 transition',
          dragOver ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50',
          disabled && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) void uploadFiles(e.target.files); }}
        />

        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : <Upload className="h-5 w-5 text-amber-600" />}
          </span>
          <p className="text-sm font-semibold text-slate-700">تصویر یا ویدیو را بکشید و رها کنید</p>
          <p className="text-xs text-slate-500">تصویر تا ۳ مگابایت · ویدیو تا ۵۰ مگابایت (MP4, WEBM)</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || disabled || value.length >= maxFiles}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'در حال آپلود...' : 'انتخاب فایل'}
          </button>
        </div>
      </div>

      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}

      {value.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((item, index) => (
            <div key={`${item.url}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {item.type === 'video' ? (
                <div className="flex h-28 flex-col items-center justify-center gap-1 bg-slate-900 text-white">
                  <Film className="h-6 w-6 text-amber-400" />
                  <Play className="h-4 w-4 opacity-70" />
                  <span className="text-[10px] font-bold">ویدیو</span>
                </div>
              ) : (
                <img src={resolveImageUrl(item.url)} alt="" className="h-28 w-full object-cover" />
              )}
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {index > 0 ? (
                  <button type="button" onClick={() => movePrimary(index)} className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-700">
                    اول گالری
                  </button>
                ) : (
                  <span className="rounded-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-white">اصلی</span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/90 text-white"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
