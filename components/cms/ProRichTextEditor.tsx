'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Film,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Palette,
  Quote,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
  Undo2
} from 'lucide-react';
import { RichHtmlContent } from '@/components/shop/RichHtmlContent';
import { adminFetch } from '@/lib/admin/client';
import { cn } from '@/lib/utils/cn';

type EditorMode = 'visual' | 'html' | 'preview';

const COLORS = ['#0f172a', '#b45309', '#15803d', '#1d4ed8', '#be123c', '#7c3aed', '#ffffff', '#f8fafc'];
const FONT_SIZES = [
  { label: 'کوچک', value: '2' },
  { label: 'معمولی', value: '3' },
  { label: 'بزرگ', value: '4' },
  { label: 'خیلی بزرگ', value: '5' },
  { label: 'عنوان', value: '6' }
];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  className
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-slate-600 transition hover:bg-slate-100',
        active ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white',
        className
      )}
    >
      {children}
    </button>
  );
}

type ProRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  uploadFolder?: 'products' | 'blog' | 'banners';
};

export function ProRichTextEditor({
  value,
  onChange,
  placeholder = 'متن را اینجا بنویسید...',
  minHeight = 320,
  uploadFolder = 'banners'
}: ProRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [htmlDraft, setHtmlDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [foreColor, setForeColor] = useState('#0f172a');
  const [backColor, setBackColor] = useState('#fef3c7');

  useEffect(() => {
    setHtmlDraft(value);
    const el = editorRef.current;
    if (!el || mode !== 'visual' || el.innerHTML === value) return;
    el.innerHTML = value || '';
  }, [value, mode]);

  const wordCount = useMemo(() => {
    const text = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [value]);

  const exec = useCallback(
    (command: string, val?: string) => {
      document.execCommand(command, false, val);
      editorRef.current?.focus();
      onChange(editorRef.current?.innerHTML || '');
    },
    [onChange]
  );

  const handleInput = () => onChange(editorRef.current?.innerHTML || '');

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (mode === 'html') onChange(htmlDraft);
    if (next === 'html') setHtmlDraft(value);
    if (next === 'visual') {
      setTimeout(() => {
        if (editorRef.current) editorRef.current.innerHTML = value || '';
      }, 0);
    }
    setMode(next);
  };

  const insertLink = () => {
    const url = window.prompt('آدرس لینک:');
    if (url) exec('createLink', url);
  };

  const insertTable = () => {
    const html =
      '<table style="width:100%;border-collapse:collapse;margin:12px 0"><tr><td style="border:1px solid #e2e8f0;padding:8px">ستون ۱</td><td style="border:1px solid #e2e8f0;padding:8px">ستون ۲</td></tr><tr><td style="border:1px solid #e2e8f0;padding:8px">...</td><td style="border:1px solid #e2e8f0;padding:8px">...</td></tr></table><p><br></p>';
    exec('insertHTML', html);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', uploadFolder);
    const { ok, data } = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (ok && data.url) exec('insertImage', data.url);
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', uploadFolder);
    fd.append('mode', 'media');
    const { ok, data } = await adminFetch<{ url: string }>('/api/admin/upload', { method: 'POST', body: fd });
    setUploading(false);
    if (!ok || !data.url || !editorRef.current) return;
    const html = `<p><video src="${data.url}" controls playsinline style="max-width:100%;border-radius:12px"></video></p>`;
    editorRef.current.focus();
    document.execCommand('insertHTML', false, html);
    onChange(editorRef.current.innerHTML);
  };

  const shell = (
    <div
      ref={wrapRef}
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        fullscreen && 'fixed inset-3 z-[250] flex flex-col shadow-2xl'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white p-2">
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            {([
              { id: 'visual' as const, label: 'ویرایش' },
              { id: 'html' as const, label: 'HTML' },
              { id: 'preview' as const, label: 'پیش‌نمایش' }
            ]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                  mode === id ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <ToolbarButton onClick={() => setFullscreen((f) => !f)} title="تمام‌صفحه">
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolbarButton>
        </div>
        <p className="text-[11px] font-medium text-slate-400">{wordCount} کلمه</p>
      </div>

      {mode === 'visual' ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 p-2">
          <ToolbarButton onClick={() => exec('undo')} title="بازگشت"><Undo2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('redo')} title="از نو"><Redo2 className="h-4 w-4" /></ToolbarButton>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <ToolbarButton onClick={() => exec('bold')} title="درشت"><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('italic')} title="کج"><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('underline')} title="زیرخط"><Underline className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('strikeThrough')} title="خط‌خورده"><Strikethrough className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('subscript')} title="زیرنویس"><Subscript className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('superscript')} title="بالانویس"><Superscript className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('removeFormat')} title="پاک‌سازی قالب"><Eraser className="h-4 w-4" /></ToolbarButton>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <ToolbarButton onClick={() => exec('formatBlock', 'h1')} title="عنوان ۱"><Heading1 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'h2')} title="عنوان ۲"><Heading2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'h3')} title="عنوان ۳"><Heading3 className="h-4 w-4" /></ToolbarButton>
          <select
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600"
            defaultValue="3"
            onChange={(e) => exec('fontSize', e.target.value)}
          >
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <ToolbarButton onClick={() => exec('insertUnorderedList')} title="لیست"><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('insertOrderedList')} title="لیست شماره‌دار"><ListOrdered className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('formatBlock', 'blockquote')} title="نقل‌قول"><Quote className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('insertHorizontalRule')} title="خط جداکننده"><Minus className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={insertTable} title="جدول"><Table className="h-4 w-4" /></ToolbarButton>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <ToolbarButton onClick={() => exec('justifyRight')} title="راست"><AlignRight className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyCenter')} title="وسط"><AlignCenter className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('justifyLeft')} title="چپ"><AlignLeft className="h-4 w-4" /></ToolbarButton>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-0.5">
            <Palette className="h-3.5 w-3.5 text-slate-500" />
            <input type="color" value={foreColor} onChange={(e) => { setForeColor(e.target.value); exec('foreColor', e.target.value); }} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" title="رنگ متن" />
            <input type="color" value={backColor} onChange={(e) => { setBackColor(e.target.value); exec('hiliteColor', e.target.value); }} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent" title="رنگ پس‌زمینه" />
          </div>
          <div className="hidden gap-0.5 sm:flex">
            {COLORS.map((c) => (
              <button key={c} type="button" title={c} onMouseDown={(e) => e.preventDefault()} onClick={() => exec('foreColor', c)} className="h-5 w-5 rounded-full border border-slate-200" style={{ background: c }} />
            ))}
          </div>
          <span className="mx-1 h-6 w-px bg-slate-200" />
          <ToolbarButton onClick={insertLink} title="لینک"><Link2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => exec('unlink')} title="حذف لینک"><Link2 className="h-4 w-4 opacity-40" /></ToolbarButton>
          <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100" title="تصویر">
            <ImagePlus className="h-4 w-4 text-slate-600" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); e.target.value = ''; }} />
          </label>
          <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100" title="ویدیو">
            <Film className="h-4 w-4 text-slate-600" />
            <input type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadVideo(f); e.target.value = ''; }} />
          </label>
          <ToolbarButton onClick={() => { const url = window.prompt('آدرس تصویر:'); if (url) exec('insertImage', url); }} title="تصویر از URL"><Code2 className="h-4 w-4" /></ToolbarButton>
        </div>
      ) : null}

      <div className={cn(fullscreen && 'min-h-0 flex-1 overflow-y-auto')}>
        {mode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            dir="rtl"
            onInput={handleInput}
            data-placeholder={placeholder}
            style={{ minHeight: fullscreen ? '100%' : minHeight }}
            className={cn(
              'prose prose-sm max-w-none px-4 py-4 text-sm leading-8 text-slate-800 outline-none',
              'empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]',
              '[&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-black [&_h3]:text-lg [&_h3]:font-bold',
              '[&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5',
              '[&_table]:w-full [&_td]:border [&_td]:border-slate-200 [&_td]:p-2',
              '[&_blockquote]:border-r-4 [&_blockquote]:border-amber-300 [&_blockquote]:pr-3',
              '[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-xl [&_hr]:my-4'
            )}
          />
        ) : null}
        {mode === 'html' ? (
          <textarea
            dir="ltr"
            value={htmlDraft}
            onChange={(e) => { setHtmlDraft(e.target.value); onChange(e.target.value); }}
            style={{ minHeight: fullscreen ? '100%' : minHeight }}
            className="w-full resize-y border-0 px-4 py-3 font-mono text-xs leading-6 text-slate-800 outline-none"
          />
        ) : null}
        {mode === 'preview' ? (
          <div className="px-4 py-4" style={{ minHeight }}>
            {value ? <RichHtmlContent html={value} /> : <p className="text-sm text-slate-400">پیش‌نمایش خالی است.</p>}
          </div>
        ) : null}
      </div>

      {uploading ? <p className="border-t border-slate-100 px-4 py-2 text-xs text-amber-700">در حال آپلود...</p> : null}
    </div>
  );

  return shell;
}
