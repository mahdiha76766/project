'use client';

import { useRef, useState } from 'react';
import { Maximize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function MediaVideoPlayer({
  src,
  poster,
  className,
  onFullscreen
}: {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div className={cn('group relative overflow-hidden rounded-2xl bg-black', className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        muted={muted}
        loop
        className="h-full w-full object-contain"
        onClick={togglePlay}
        onEnded={() => setPlaying(false)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-surface-900 shadow-lg backdrop-blur"
          aria-label={playing ? 'توقف' : 'پخش'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="mr-0.5 h-4 w-4" />}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-surface-800 shadow"
            aria-label={muted ? 'فعال‌سازی صدا' : 'قطع صدا'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {onFullscreen ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFullscreen();
              }}
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-surface-800 shadow"
              aria-label="تمام‌صفحه"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {!playing ? (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-label="پخش ویدیو"
        >
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-xl ring-4 ring-white/40">
            <Play className="mr-0.5 h-7 w-7" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
