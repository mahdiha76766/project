# Next.js Shop Architecture

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` and set:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/shop_db
   ```
3. Run project:
   ```bash
   npm run dev
   ```
4. Seed categories:
   ```bash
   npm run seed
   ```

## Implemented Pages

- `/` Home page (hero, categories, best sellers, featured, discount, fresh oils, popular spices, benefits, testimonials, blog, FAQ, footer)
- `/products` Product listing with search/filter/sort UI and grid
- `/categories` Category listing page
- `/products/[slug]` Product details with purchase actions, specs, similar and complementary products

## Folders

- `app`
- `components`
- `lib`
- `models`
- `server`
- `types`
- `constants`
- `hooks`
- `scripts`
