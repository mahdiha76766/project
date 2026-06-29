/** Client-safe slider types and defaults — no Mongoose imports */

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge?: string;
}

export interface HeroSliderConfig {
  slides: HeroSlide[];
  autoplayInterval?: number;
}

export const defaultSlides: HeroSlide[] = [
  {
    badge: 'عطاری آنلاین',
    title: 'روغن‌های تازه‌گیری‌شده',
    subtitle: 'کیفیت ممتاز و طبیعی — مستقیم از کارگاه به خانه شما',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1600&q=80',
    ctaText: 'خرید روغن‌ها',
    ctaLink: '/products?category=oils'
  },
  {
    badge: 'ادویه اصیل',
    title: 'ادویه‌های خوش‌عطر',
    subtitle: 'طعم اصیل ایرانی با گزینش دست‌چین',
    image: 'https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f?w=1600&q=80',
    ctaText: 'مشاهده ادویه‌ها',
    ctaLink: '/products?category=spices'
  }
];

export const defaultSliderConfig: HeroSliderConfig = {
  slides: defaultSlides,
  autoplayInterval: 6000
};
