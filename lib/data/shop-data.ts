import type { ShopCategory, ShopProduct } from '@/types/shop';

export const storeCategories: ShopCategory[] = [
  { name: 'روغن‌ها', slug: 'oils', description: 'روغن‌های طبیعی و تازه‌گیری‌شده' },
  { name: 'ادویه‌ها', slug: 'spices', description: 'ادویه‌های اصل و خوش‌عطر' },
  { name: 'ارده و شیره', slug: 'tahini-syrup', description: 'محصولات مقوی سنتی' },
  { name: 'گیاهان دارویی', slug: 'herbal-plants', description: 'گیاهان دارویی خشک و تازه' },
  { name: 'عرقیات', slug: 'distillates', description: 'عرقیات گیاهی سنتی' },
  { name: 'دمنوش‌ها', slug: 'teas', description: 'دمنوش‌های آرامش‌بخش' },
  { name: 'محصولات ویژه', slug: 'special-products', description: 'انتخاب‌های خاص فروشگاه' },
  { name: 'پک‌های هدیه', slug: 'gift-packs', description: 'پک‌های مناسب هدیه' },
  { name: 'فروش عمده', slug: 'bulk-sales', description: 'خرید عمده با قیمت مناسب' }
];

export const products: ShopProduct[] = [
  { id: '1', name: 'روغن کنجد فرابکر', slug: 'sesame-oil-extra-virgin', shortDescription: 'تازه‌گیری روز با عطر طبیعی', fullDescription: 'روغن کنجد تهیه شده با دستگاه پرس سرد، مناسب سالاد و پخت سبک.', category: 'oils', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'], price: 420000, discountPrice: 380000, stock: 25, type: 'oil', tags: ['پرس سرد', 'کنجد'], attributes: { origin: 'یزد', extraction: 'پرس سرد' }, volumeOptions: ['500ml', '1L'], temperament: 'گرم', featured: true, bestSeller: true, freshPressed: true, productionDate: '2026-05-01', expiryDate: '2027-05-01' },
  { id: '2', name: 'زردچوبه ممتاز هندی', slug: 'premium-turmeric', shortDescription: 'رنگ‌دهی بالا و عطر قوی', fullDescription: 'زردچوبه آسیاب تازه با کیفیت صادراتی.', category: 'spices', images: ['https://images.unsplash.com/photo-1615485291234-9fbc5ec80a8f'], price: 155000, stock: 80, type: 'spice', tags: ['زردچوبه', 'ادویه'], attributes: { grind: 'نرم', purity: '100%' }, weightOptions: ['100g', '250g'], temperament: 'گرم', popularSpice: true, bestSeller: true },
  { id: '3', name: 'روغن سیاهدانه خالص', slug: 'black-seed-oil', shortDescription: 'تقویت سیستم ایمنی', fullDescription: 'روغن سیاهدانه طبیعی برای مصرف خوراکی و موضعی.', category: 'oils', images: ['https://images.unsplash.com/photo-1510626176961-4b57d4fbad03'], price: 510000, stock: 12, type: 'oil', tags: ['سیاهدانه'], attributes: { extraction: 'سنتی' }, volumeOptions: ['250ml'], temperament: 'گرم', featured: true, freshPressed: true },
  { id: '4', name: 'پک هدیه سلامتی', slug: 'healthy-gift-pack', shortDescription: 'مجموعه روغن و ادویه منتخب', fullDescription: 'پک ترکیبی مناسب هدیه شامل روغن کنجد، زنجبیل و دارچین.', category: 'gift-packs', images: ['https://images.unsplash.com/photo-1514996937319-344454492b37'], price: 980000, discountPrice: 850000, stock: 6, type: 'gift', tags: ['هدیه'], attributes: { items: '3 قلم' }, featured: true },
  { id: '5', name: 'دارچین سیگاری', slug: 'cinnamon-stick', shortDescription: 'معطر و تازه', fullDescription: 'دارچین اصل مناسب دمنوش و غذا.', category: 'spices', images: ['https://images.unsplash.com/photo-1505253213348-cd54c92b37be'], price: 240000, stock: 45, type: 'spice', tags: ['دارچین'], attributes: { form: 'چوبی' }, weightOptions: ['100g', '500g'], popularSpice: true }
];

export const testimonials = [
  { name: 'سمیرا احمدی', text: 'کیفیت روغن‌ها فوق‌العاده بود و بسته‌بندی خیلی تمیز انجام شده بود.' },
  { name: 'مهدی نوروزی', text: 'ادویه‌ها واقعاً تازه و خوش‌عطر بودند. حتماً دوباره خرید می‌کنم.' }
];

export const blogPosts = [
  { title: 'چطور روغن اصل را تشخیص دهیم؟', slug: 'identify-original-oil' },
  { title: 'بهترین ادویه برای غذاهای ایرانی', slug: 'best-spices-for-iranian-food' }
];
