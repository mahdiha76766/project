import type { GalleryMediaItem } from '@/lib/media/gallery';

export function normalizeProductMediaInput(body: {
  media?: GalleryMediaItem[];
  images?: string[];
}): { media: GalleryMediaItem[]; images: string[] } {
  const media: GalleryMediaItem[] = body.media?.length
    ? body.media
        .filter((m) => m?.url)
        .map((m) => ({
          type: m.type === 'video' ? 'video' : 'image',
          url: String(m.url).trim(),
          poster: m.poster?.trim() || ''
        }))
    : (body.images || []).filter(Boolean).map((url) => ({ type: 'image' as const, url: String(url).trim() }));

  const images = media.filter((m) => m.type === 'image').map((m) => m.url);
  return { media, images };
}
