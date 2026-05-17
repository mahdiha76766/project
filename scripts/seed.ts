import { connectToDatabase } from '@/lib/db/mongoose';
import { Category } from '@/models';
import { slugify } from '@/lib/utils/slugify';

const defaultCategories = ['مواد غذایی', 'نوشیدنی', 'لوازم خانگی', 'آرایشی و بهداشتی'];

const seed = async () => {
  await connectToDatabase();

  for (const name of defaultCategories) {
    const slug = slugify(name);
    await Category.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name, slug, isActive: true } },
      { upsert: true, new: true }
    );
  }

  console.log('Seed completed.');
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
