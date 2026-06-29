import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  defaultSliderConfig,
  defaultSlides,
  type HeroSliderConfig
} from '@/lib/admin/slider-config';

export type { HeroSlide, HeroSliderConfig } from '@/lib/admin/slider-config';
export { defaultSlides, defaultSliderConfig } from '@/lib/admin/slider-config';

function normalizeConfig(value: unknown): HeroSliderConfig {
  if (Array.isArray(value) && value.length) {
    return { slides: value as HeroSliderConfig['slides'], autoplayInterval: 6000 };
  }
  if (value && typeof value === 'object' && Array.isArray((value as HeroSliderConfig).slides)) {
    const cfg = value as HeroSliderConfig;
    return {
      slides: cfg.slides.length ? cfg.slides : defaultSlides,
      autoplayInterval: cfg.autoplayInterval || 6000
    };
  }
  return defaultSliderConfig;
}

export const getHeroSliderConfig = async (): Promise<HeroSliderConfig> => {
  try {
    await connectToDatabase();
    const setting = await Setting.findOne({ key: 'home_hero_slides' }).lean() as { value?: unknown } | null;
    return normalizeConfig(setting?.value);
  } catch {
    return defaultSliderConfig;
  }
};

/** @deprecated use getHeroSliderConfig */
export const getHeroSlides = async () => {
  const cfg = await getHeroSliderConfig();
  return cfg.slides;
};
