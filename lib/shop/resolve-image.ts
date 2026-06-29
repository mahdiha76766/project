export const resolveImage = (image?: string, fallback = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5') => {
  if (!image) return fallback;
  const cleaned = image.replaceAll('\\', '/').replace(/^public\//, '').trim();
  if (!cleaned) return fallback;
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned;
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
};
