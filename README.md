# Next.js Shop Architecture (Launch Ready)

## UI/UX ایران
- رابط کاربری کاملاً راست‌چین (RTL) و مناسب زبان فارسی
- هدر/منوی اصلی سایت + دکمه‌های ورود و ثبت‌نام
- آیکون‌های UI حرفه‌ای (SVG icon set داخلی)

## SEO
- Metadata کامل صفحه اصلی
- Metadata داینامیک محصولات، دسته‌بندی‌ها و مقالات
- `sitemap.xml` و `robots.txt`
- canonical URL
- Open Graph image
- Schema.org Product + Breadcrumb + FAQ
- URLهای تمیز (`/products/:slug`, `/categories/:slug`, `/blog/:slug`)

## Security
- هش رمز عبور با bcrypt
- محافظت routeهای admin/dashboard
- کنترل role در سمت سرور
- اعتبارسنجی ورودی auth با Zod
- اعتبارسنجی قیمت/تخفیف فقط در سرور (checkout)
- Rate limit برای login/register
- session token در cookie امن HttpOnly
- لاگ ساختاریافته خطا/رویداد

## Performance
- lazy loading تصاویر کارت محصول
- Server Components برای صفحات اصلی
- ایندکس MongoDB روی product text search
- پایه cache/بهینه‌سازی query و آماده pagination

## Operations & Monitoring
- endpoint سلامت: `GET /api/health`
- لاگ پرداخت، سفارش، خطا قابل اتصال به Sentry/ELK
- برنامه پیشنهادی دیپلوی:
  - Vercel (Next.js)
  - MongoDB Atlas
  - Cloudflare (DNS + CDN)
  - Cloudflare R2 یا S3 (تصاویر)
  - Railway/Render/VPS (سرویس جانبی)
- مانیتورینگ:
  - هشدار کم‌موجودی
  - هشدار خطای پرداخت
  - هشدار سفارش جدید
  - بکاپ دیتابیس
  - اتصال Search Console

## Test Checklist
`tests/launch-checklist.md`
