import { FEEDAR_SOCIALS } from '@/lib/feedar/content';

export type SocialLink = { label: string; href: string; icon: string };

export function socialsFromContact(contact?: {
  telegram?: string;
  instagram?: string;
  whatsapp?: string;
  linkedin?: string;
} | null): SocialLink[] {
  const items: SocialLink[] = [
    { label: 'تلگرام', href: contact?.telegram || '', icon: 'telegram' },
    { label: 'اینستاگرام', href: contact?.instagram || '', icon: 'instagram' },
    { label: 'واتساپ', href: contact?.whatsapp || '', icon: 'whatsapp' },
    { label: 'لینکدین', href: contact?.linkedin || '', icon: 'linkedin' }
  ].filter((item) => item.href.trim());

  return items.length ? items : FEEDAR_SOCIALS.map((item) => ({ ...item }));
}
