'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, RotateCcw, X, ZoomIn } from 'lucide-react';
import type { GalleryMediaItem } from '@/lib/media/gallery';
import { DiscountBadge } from '@/components/shop/DiscountBadge';
import { MediaVideoPlayer } from '@/components/shop/MediaVideoPlayer';
import { cn } from '@/lib/utils/cn';

function GalleryLightbox({
  media,
  index,
  name,
  onClose,
  onNavigate
}: {
  media: GalleryMediaItem[];
  index: number;
  name: string;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const item = media[index];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate(index < media.length - 1 ? index + 1 : 0);
      if (e.key === 'ArrowLeft') onNavigate(index > 0 ? index - 1 : media.length - 1);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [index, media.length, onClose, onNavigate]);

  const onWheel = (e: React.WheelEvent) => {
    if (item.type !== 'image') return;
    e.preventDefault();
    setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (item.type !== 'image' || zoom <= 1) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  return (
    <div className="fixed inset-0 top-0 left-0 z-[200] flex h-full w-full flex-col bg-black/95 backdrop-blur-sm" role="dialog" aria-modal aria-label="گالری تمام‌صفحه">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <p className="truncate text-sm font-semibold">{name} — {index + 1} از {media.length}</p>
        <div className="flex items-center gap-2">
          {item.type === 'image' ? (
            <>
              <button type="button" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="بزرگ‌نمایی">
                <Plus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="کوچک‌نمایی">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="بازنشانی">
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          ) : null}
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="بستن">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
        <button
          type="button"
          onClick={() => onNavigate(index > 0 ? index - 1 : media.length - 1)}
          className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20"
          aria-label="قبلی"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div
          className="flex max-h-full max-w-full items-center justify-center"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          style={{ cursor: item.type === 'image' && zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        >
          {item.type === 'video' ? (
            <MediaVideoPlayer src={item.url} poster={item.poster} className="max-h-[75vh] w-full max-w-4xl" />
          ) : (
            <img
              src={item.url}
              alt={name}
              draggable={false}
              className="max-h-[75vh] max-w-full select-none rounded-lg object-contain transition-transform duration-200"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => onNavigate(index < media.length - 1 ? index + 1 : 0)}
          className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/20"
          aria-label="بعدی"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
        {media.map((m, i) => (
          <button
            key={`${m.url}-${i}`}
            type="button"
            onClick={() => onNavigate(i)}
            className={cn(
              'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition',
              i === index ? 'ring-brand-400' : 'ring-transparent opacity-60 hover:opacity-100'
            )}
          >
            {m.type === 'video' ? (
              <>
                {m.poster ? <img src={m.poster} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-surface-800 text-[10px] text-white">ویدیو</span>}
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">▶</span>
              </>
            ) : (
              <img src={m.url} alt="" className="h-full w-full object-cover" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductMediaGallery({
  media,
  name,
  discountLabel
}: {
  media: GalleryMediaItem[];
  name: string;
  discountLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const active = media[index] || media[0];

  const go = useCallback((next: number) => {
    setIndex(((next % media.length) + media.length) % media.length);
  }, [media.length]);

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden rounded-2xl bg-surface-50 ring-1 ring-surface-200/80">
        {discountLabel ? <DiscountBadge label={discountLabel} variant="ribbon" size="md" /> : null}
        <div className="aspect-square w-full">
          {active.type === 'video' ? (
            <MediaVideoPlayer
              src={active.url}
              poster={active.poster}
              className="h-full w-full"
              onFullscreen={() => setLightbox(true)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="relative block h-full w-full"
              aria-label="بزرگ‌نمایی تصویر"
            >
              <img src={active.url} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
                بزرگ‌نمایی
              </span>
            </button>
          )}
        </div>

        {media.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-surface-800 shadow-lg ring-1 ring-black/5 transition hover:bg-white"
              aria-label="تصویر قبلی"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-surface-800 shadow-lg ring-1 ring-black/5 transition hover:bg-white"
              aria-label="تصویر بعدی"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute left-3 top-3 rounded-full bg-white/90 p-2 text-surface-700 shadow ring-1 ring-black/5 hover:bg-white"
          aria-label="نمایش گالری"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {media.length > 1 ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            {(index + 1).toLocaleString('fa-IR')} / {media.length.toLocaleString('fa-IR')}
          </div>
        ) : null}
      </div>

      {media.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button
              key={`${m.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition',
                i === index ? 'ring-brand-500 shadow-md' : 'ring-surface-200 opacity-70 hover:opacity-100'
              )}
            >
              {m.type === 'video' ? (
                <>
                  {m.poster ? <img src={m.poster} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center bg-surface-200 text-[10px] text-surface-600">ویدیو</span>}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-xs text-white">▶</span>
                </>
              ) : (
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <GalleryLightbox
          media={media}
          index={index}
          name={name}
          onClose={() => setLightbox(false)}
          onNavigate={go}
        />
      ) : null}
    </div>
  );
}
