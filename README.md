# Next.js Shop Architecture

## ماژول‌های تکمیل‌شده
- فروشگاه عمومی، لیست محصولات، دسته‌بندی، جستجو/فیلتر/مرتب‌سازی
- احراز هویت، سبد خرید، checkout، پرداخت، ثبت سفارش
- داشبورد مشتری: خلاصه، سفارش‌ها، آدرس‌ها، پروفایل، تغییر رمز، علاقه‌مندی، نظرات، کدهای من، مرجوعی
- پنل ادمین: داشبورد آماری + مدیریت محصولات، دسته‌بندی‌ها، سفارش‌ها، کد تخفیف، ارسال، کاربران، بلاگ و تنظیمات

## صفحات کلیدی
- Customer: `/dashboard`, `/dashboard/orders`, `/dashboard/addresses`, `/dashboard/profile`, `/dashboard/password`, `/dashboard/wishlist`, `/dashboard/reviews`, `/dashboard/coupons`, `/dashboard/returns`
- Admin: `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/coupons`, `/admin/shipping`, `/admin/users`, `/admin/blog`, `/admin/settings`

## APIهای کلیدی
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Cart/Checkout: `GET|POST|PATCH|DELETE /api/cart`, `POST /api/checkout`, `POST /api/coupons/validate`
- Payment/Orders: `POST /api/payment/create`, `POST /api/payment/callback`, `GET /api/orders/:id`
- Customer panel APIs: `/api/dashboard/*`
- Admin panel APIs: `/api/admin/*`

## Setup
1. `npm install`
2. `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/shop_db
AUTH_SECRET=change-me
```
3. `npm run dev`
