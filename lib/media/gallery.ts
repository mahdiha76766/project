import { resolveImage } from '@/lib/shop/resolve-image';

export type GalleryMediaItem = {
  type: 'image' | 'video';
  url: string;
  poster?: string;
};

export function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes('/videos/');
}

export function normalizeGalleryMedia(
  media?: GalleryMediaItem[] | null,
  fallbackImages?: string[]
): GalleryMediaItem[] {
  if (media?.length) {
    return media.map((m) => ({
      type: m.type || (isVideoUrl(m.url) ? 'video' : 'image'),
      url: resolveImage(m.url),
      poster: m.poster ? resolveImage(m.poster) : undefined
    }));
  }
  const imgs = fallbackImages?.length ? fallbackImages : [];
  if (!imgs.length) return [{ type: 'image', url: resolveImage(undefined) }];
  return imgs.map((url) => ({ type: 'image' as const, url: resolveImage(url) }));
}

export function galleryToImageUrls(media: GalleryMediaItem[]) {
  return media.filter((m) => m.type === 'image').map((m) => m.url);
}
