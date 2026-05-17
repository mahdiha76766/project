# Next.js Shop Architecture

## Features
- ثبت‌نام و ورود با موبایل/رمز عبور
- محافظت مسیرهای داشبورد و ادمین براساس نقش
- سبد خرید برای کاربر مهمان (frontend localStorage/cookie) و کاربر لاگین‌شده (MongoDB)
- اعتبارسنجی کد تخفیف در سرور با محدودیت‌های کامل
- محاسبه هزینه ارسال براساس روش، وزن، شهر/استان و مبلغ سفارش
- checkout کامل با ساخت سفارش، ثبت پرداخت، کاهش موجودی، ثبت مصرف کد و پیامک تایید
- صفحه نتیجه پرداخت و جزئیات سفارش کاربر

## Setup
1. `npm install`
2. Set `.env.local`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/shop_db
AUTH_SECRET=change-me
```
3. `npm run dev`

## APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET|POST|PATCH|DELETE /api/cart`
- `POST /api/coupons/validate`
- `POST /api/checkout`
- `POST /api/payment/create`
- `POST /api/payment/callback`
- `GET /api/orders/:id`
