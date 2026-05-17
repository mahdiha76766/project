import { Setting } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export const defaultSlides: HeroSlide[] = [
  { title: 'روغن‌های تازه‌گیری‌شده', subtitle: 'کیفیت ممتاز و طبیعی', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5', ctaText: 'خرید روغن‌ها', ctaLink: '/products?category=oils' },
  { title: 'ادویه‌های خوش‌عطر', subtitle: 'طعم اصیل ایرانی', image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f', ctaText: 'مشاهده ادویه‌ها', ctaLink: '/products?category=spices' }
];

export const getHeroSlides = async (): Promise<HeroSlide[]> => {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne({ key: 'home_hero_slides' }).lean();
    return (setting?.value as HeroSlide[])?.length ? (setting.value as HeroSlide[]) : defaultSlides;
  } catch {
    return defaultSlides;
  }
};
