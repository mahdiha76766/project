# سیستم Environment و استقرار Production

مستند معماری قابل‌استفاده مجدد برای سیستم متغیرهای محیطی (Env) و قرارگیری پروژه روی سرور در حالت production.

هدف: پورت کردن همین الگو به محصول دیگر (به‌خصوص Next.js روی cPanel / shared hosting / PM2).

**Stack مرجع:** Next.js 15 (custom server) · Node 20 · MongoDB · PM2 · cPanel  
**بدون:** Docker · Vercel · dotenv package · Kubernetes

---

## فهرست

1. [نمای کلی](#1-نمای-کلی)
2. [معماری Env](#2-معماری-env)
3. [فهرست کامل متغیرها](#3-فهرست-کامل-متغیرها)
4. [بارگذاری و اعتبارسنجی](#4-بارگذاری-و-اعتبارسنجی)
5. [MongoDB و Uploads](#5-mongodb-و-uploads)
6. [معماری Production / سرور](#6-معماری-production--سرور)
7. [اسکریپت‌های Build و Deploy](#7-اسکریپتهای-build-و-deploy)
8. [PM2 و cPanel](#8-pm2-و-cpanel)
9. [پنل ادمین استقرار](#9-پنل-ادمین-استقرار)
10. [Cron و عملیات پس‌زمینه](#10-cron-و-عملیات-پسزمینه)
11. [چک‌لیست استقرار](#11-چکلیست-استقرار)
12. [الگوی قابل‌استفاده در پروژه دیگر](#12-الگوی-قابلاستفاده-در-پروژه-دیگر)
13. [نقشه فایل‌ها](#13-نقشه-فایلها)
14. [نکات و دام‌ها](#14-نکات-و-دامها)

---

## 1. نمای کلی

این پروژه یک اپلیکیشن **Next.js با custom server** است (`server.js`) که برای **هاست اشتراکی cPanel** طراحی شده:

1. روی ماشین توسعه‌دهنده (ترجیحاً Linux/WSL) **build** می‌شود.
2. خروجی `.next/` + `node_modules/` (بدون devDeps) + فایل‌های ریشه آپلود می‌شود.
3. روی سرور با `NODE_ENV=production` و `node server.js` / **PM2** اجرا می‌شود.
4. تنظیمات حساس فقط در فایل `.env` روی سرور نگه‌داری می‌شوند (نه در Git).

```mermaid
flowchart TB
  subgraph Dev["ماشین توسعه / WSL"]
    CI[npm ci]
    BUILD[npm run build]
    PRUNE[npm run deploy:prune]
    CHECK[npm run deploy:check]
    CI --> BUILD --> PRUNE --> CHECK
  end

  subgraph Upload["آپلود به سرور"]
    ART[".next / node_modules / public / server.js / ..."]
  end

  subgraph Server["سرور cPanel"]
    ENV[".env روی دیسک"]
    SJ[server.js]
    PM2[PM2: app name]
    NEXT[Next.js custom HTTP]
    UP[(UPLOADS_DIR)]
    MONGO[(MongoDB)]
    ENV --> SJ
    PM2 --> SJ
    SJ --> NEXT
    SJ --> UP
    NEXT --> MONGO
  end

  CHECK --> ART --> Server
```

---

## 2. معماری Env

### 2.1 لایه‌ها

| لایه | مسیر | نقش |
|------|------|-----|
| فایل خام | `.env` / `.env.local` | منبع حقیقت روی دیسک سرور |
| لودر دستی | `server.js` → `loadEnvFile()` | خواندن فایل قبل از Next (بدون پکیج `dotenv`) |
| اعتبارسنجی جزئی | `server/config/env.ts` | Zod روی زیرمجموعه‌ای از متغیرها |
| Mongo resolve | `lib/db/mongo-config.ts` (+ `.cjs`) | URI، mask، `authSource` |
| Uploads | `lib/admin/upload-storage.ts` (+ `.cjs`) | فقط از `UPLOADS_DIR` |
| دستورالعمل ادمین | `lib/admin/deploy-config.ts` | تولید متن `.env` و دستورات start (ذخیره در Mongo، **نه** نوشتن روی دیسک) |

### 2.2 اولویت مقداردهی

```text
1) متغیرهایی که از قبل در process.env هستند (cPanel / PM2 / سیستم)
2) مقادیر فایل .env
3) مقادیر فایل .env.local
4) پیش‌فرض‌های کد (مثلاً PORT=3000، NODE_ENV=production اگر خالی باشد)
```

در `loadEnvFile` فقط وقتی کلید set می‌شود که `!process.env[key]` — یعنی **متغیرهای تزریق‌شده از cPanel/PM2 برنده می‌شوند**.

### 2.3 اصل طراحی: Env زنده در runtime

`MONGODB_URI` در `env.ts` به‌صورت **getter** خوانده می‌شود تا در زمان build داخل باینری فریز نشود:

```ts
get MONGODB_URI() {
  return (process.env.MONGODB_URI || '').trim() || DEFAULT_MONGODB_URI;
}
```

برای پورت به پروژه دیگر همین الگو را برای هر secret که ممکن است بعد از build عوض شود حفظ کنید.

### 2.4 چه چیزی در Git نیست

- `.env` و `.env.*` در `.gitignore`
- توجه: در این ریپو `.env.example` هم ممکن است ignore شده باشد؛ برای پورت، حتماً `.env.example` را track کنید.

---

## 3. فهرست کامل متغیرها

### 3.1 الزامی / قویاً توصیه‌شده در Production

| متغیر | الزام | توضیح | پیش‌فرض |
|-------|-------|--------|---------|
| `MONGODB_URI` | **الزامی در prod** | اتصال MongoDB | در prod خالی؛ در dev: `mongodb://localhost:27017/shop_db` |
| `UPLOADS_DIR` | **الزامی** | مسیر مطلق پوشه آپلود پایدار | بدون پیش‌فرض — بدون آن `server.js` exit می‌کند |
| `AUTH_SECRET` | قویاً توصیه‌شده | HMAC توکن نشست | `dev-secret-change-me` (ناامن) |
| `APP_BASE_URL` | توصیه‌شده | آدرس مطلق برای ریدایرکت پرداخت | `http://localhost:${PORT}` |
| `NEXT_PUBLIC_SITE_URL` | توصیه‌شده | URL عمومی / کاننیکال SEO | fallback داخلی سایت |
| `NODE_ENV` | نرم | حالت اجرا | اگر خالی: `production` در `server.js` |
| `PORT` | اختیاری | پورت listen | `3000` |
| `HOSTNAME` | اختیاری | bind address | `0.0.0.0` |

### 3.2 پرداخت (SEP سامان)

| متغیر | الزام | توضیح |
|-------|-------|--------|
| `SAMAN_TERMINAL_ID` | برای درگاه زنده | Terminal ID |
| `SAMAN_MERCHANT_ID` | برای درگاه زنده | Merchant ID |
| `SAMAN_CALLBACK_URL` | اختیاری | Override کال‌بک؛ وگرنه از `APP_BASE_URL` |
| `SAMAN_TERMINAL_PASS` | در قالب/UI هست | **در کد درگاه خوانده نمی‌شود** (فقط مستند/فرم) |

رفتار مهم: در `NODE_ENV=production` همیشه درگاه واقعی `SepGateway` انتخاب می‌شود؛ در غیر production از `MockGateway`.

### 3.3 مالی و سفارش

| متغیر | پیش‌فرض | توضیح |
|-------|---------|--------|
| `PAYMENT_TAX_RATE` | `0` | نرخ مالیات ۰ تا ۱ |
| `WALLET_MIN_WITHDRAWAL` | `10000` | حداقل برداشت کیف‌پول |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | `15` (حداقل schema: ۵) | مهلت پرداخت آنلاین |

### 3.4 امنیت عملیات

| متغیر | توضیح |
|-------|--------|
| `CRON_SECRET` | اگر set باشد، `/api/cron/expire-payments` هدر `x-cron-secret` می‌خواهد؛ اگر خالی باشد endpoint باز است |

### 3.5 پیامک و سایر

| متغیر | توضیح |
|-------|--------|
| `SMS_IR_API_KEY` | fallback اگر در تنظیمات DB نبود |
| `SMS_IR_SANDBOX_API_KEY` | sandbox SMS |
| `SITE_URL` | origin اضافه برای price-portal security |
| `BASE_URL` / `BLOG_ID` | فقط اسکریپت تست |

### 3.6 نمونه فایل `.env` Production

```bash
PORT=3000
NODE_ENV=production
HOSTNAME=0.0.0.0

MONGODB_URI=mongodb://USER:PASS@127.0.0.1:27017/DBNAME

AUTH_SECRET=replace-with-long-random-secret-min-32-chars
APP_BASE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com

UPLOADS_DIR=/home/USER/web/uploads

SAMAN_TERMINAL_ID=
SAMAN_MERCHANT_ID=
SAMAN_CALLBACK_URL=https://your-domain.com/api/payment/verify

PAYMENT_TAX_RATE=0
WALLET_MIN_WITHDRAWAL=10000
ORDER_PAYMENT_TIMEOUT_MINUTES=15

CRON_SECRET=optional-random-secret

# SMS_IR_API_KEY=
# SMS_IR_SANDBOX_API_KEY=
```

مرجع قالب پروژه: `.env.example`

---

## 4. بارگذاری و اعتبارسنجی

### 4.1 لودر داخل `server.js`

```js
function loadEnvFile(filePath) {
  // خطوط # نادیده
  // KEY=VAL با پشتیبانی کوتیشن ' یا "
  // فقط اگر process.env[key] خالی باشد set می‌شود
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
```

دلیل وجود لودر دستی: روی cPanel گاهی همه متغیرها inject نمی‌شوند؛ فایل `.env` باید قبل از `next()` خوانده شود.

### 4.2 Zod در `server/config/env.ts`

اعتبارسنجی می‌شود:

- `PORT`, `MONGODB_URI` (optional string), `NODE_ENV`
- `SAMAN_*`, `PAYMENT_TAX_RATE`, `WALLET_MIN_WITHDRAWAL`, `ORDER_PAYMENT_TIMEOUT_MINUTES`, `APP_BASE_URL`

**اعتبارسنجی نمی‌شود (ولی مصرف می‌شود):**

- `AUTH_SECRET`, `CRON_SECRET`, `UPLOADS_DIR`, `NEXT_PUBLIC_SITE_URL`, `SMS_IR_*`, `HOSTNAME`, `SAMAN_TERMINAL_PASS`

شکست parse در import می‌تواند ماژول را crash کند — در پورت، یا schema را soft کنید یا boot را wrap کنید.

### 4.3 Dev vs Prod entry

| اسکریپت | رفتار |
|---------|--------|
| `npm run dev` → `scripts/run-dev.js` | `NODE_ENV=development` سپس `require('../server.js')` |
| `npm run prod` / `npm start` | `node server.js` (پیش‌فرض production) |
| `npm run build` → `scripts/build-production.js` | اجبار `NODE_ENV=production` + `next build` |

---

## 5. MongoDB و Uploads

### 5.1 Mongo

فایل‌ها: `lib/db/mongo-config.ts` و نسخه CommonJS `lib/db/mongo-config.cjs` (برای `server.js` و اسکریپت‌ها).

منطق:

1. خواندن `MONGODB_URI` یا default (فقط در غیر-production).
2. استخراج `dbName` از مسیر URI.
3. اگر `authSource` نبود → اضافه کردن `?authSource=<dbName>`.
4. Mask کردن پسورد برای لاگ: `user:***@`.

```mermaid
flowchart LR
  A[process.env.MONGODB_URI] --> B{خالی؟}
  B -->|بله و prod| C[خطا / بدون اتصال]
  B -->|بله و dev| D[localhost/shop_db]
  B -->|خیر| E[URI از env]
  D --> F[ensureAuthSource]
  E --> F
  F --> G[mongoose connect]
```

تست بدون بالا آوردن Next: `npm run check:mongo`

Health: `GET /api/health` — وضعیت Mongo + URI ماسک‌شده + `nodeEnv`.

### 5.2 Uploads

- فقط از `UPLOADS_DIR` (مسیر مطلق).
- در production بدون آن سرور استارت نمی‌شود.
- `server.js` زیرپوشه‌ها را می‌سازد: `banners`, `products`, `blog`, `categories`, `videos`, `receipts`.
- فایل‌های `/uploads/*` را مستقیم از دیسک serve می‌کند (با محافظت path traversal).
- سازگاری با آپلودهای قدیمی داخل `public/uploads`.
- پوشه `uploads/` روی سرور باید **بین دیپلوی‌ها حفظ شود** (پاک نشود).

مثال:

```text
UPLOADS_DIR=/home/nedicon1/web/uploads
```

---

## 6. معماری Production / سرور

### 6.1 جریان درخواست

```text
Browser
  → cPanel / Nginx / Apache (80/443)
    → Node app روی PORT داخلی
      → server.js
        → اگر /uploads/* → فایل از UPLOADS_DIR
        → وگرنه Next.js request handler
          → API / SSR / static از .next
```

### 6.2 قرارگیری مرجع این پروژه (cPanel)

| آیتم | مقدار مرجع |
|------|------------|
| Application root | `/home/nedicon1/web` |
| Startup file | `server.js` |
| Node.js | **20.x** |
| Env | `NODE_ENV=production` |
| Uploads | `/home/nedicon1/web/uploads` |
| PM2 app name | `nedico.net` |

این مسیرها را در پروژه جدید با مسیر واقعی کاربر سرور جایگزین کنید.

### 6.3 چه چیزی آپلود می‌شود / نمی‌شود

**آپلود:**

- `.next/`
- `node_modules/` (بعد از prune)
- `public/`
- `server.js`, `next.config.js`, `package.json`, `package-lock.json`
- `ecosystem.config.cjs`, `.npmrc`
- `postcss.config.js`, `tailwind.config.js` (برای سازگاری tooling)
- `lib/db/mongo-config.cjs`, `lib/admin/upload-storage.cjs`

**آپلود نشود:**

- `.git`
- سورس `app/`, `components/` (برای runtime لازم نیست اگر build کامل باشد)
- cacheهای development داخل `.next/cache/webpack/*-development*`
- `.env` از ماشین توسعه (روی سرور جدا بسازید)

لیست زنده بعد از `npm run deploy:check` در `deploy-manifest.txt` نوشته می‌شود.

### 6.4 قانون طلایی CSS / Tailwind

1. همیشه با `npm ci` (شامل devDependencies) بیلد کنید.
2. بعد از بیلد: `npm run deploy:prune`.
3. **هرگز** بعد از prune روی سرور `npm run build` نزنید — CSS خام `@tailwind` باقی می‌ماند و سایت بی‌استایل می‌شود.
4. `deploy:check` وجود CSS کامپایل‌شده را assert می‌کند.

### 6.5 SWC و پلتفرم

اگر `node_modules` روی Windows بیلد شود و به Linux آپلود شود، `@next/swc-win32` به‌جای `linux` می‌آید و اپ می‌شکند. **بیلد و `npm ci` را روی Linux/WSL هم‌پلتفرم با سرور انجام دهید.**

---

## 7. اسکریپت‌های Build و Deploy

از `package.json`:

| Script | دستور | کاربرد |
|--------|--------|--------|
| `dev` | `node scripts/run-dev.js` | توسعه با custom server |
| `build` | `node scripts/build-production.js` | `next build` با NODE_ENV=production |
| `build:clean` | پاک کردن `.next` + build | بیلد تمیز |
| `start` / `prod` | `node server.js` | اجرای production |
| `deploy:prune` | `npm prune --omit=dev` | کوچک‌کردن node_modules برای آپلود |
| `deploy:check` | `node scripts/prepare-cpanel-deploy.js` | اعتبارسنجی آرتیفکت + نوشتن manifest |
| `check:mongo` | `node scripts/check-mongo.js` | تست اتصال Mongo |

گردش کار پیشنهادی:

```bash
npm ci
npm run build
npm run deploy:prune
npm run deploy:check
# سپس آپلود طبق deploy-manifest.txt
```

---

## 8. PM2 و cPanel

### 8.1 `ecosystem.config.cjs`

```js
module.exports = {
  apps: [{
    name: 'nedico.net',          // در پروژه جدید عوض شود
    script: './server.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3000,
      HOSTNAME: '0.0.0.0'
    }
  }]
};
```

### 8.2 دستورات روی سرور (SSH)

```bash
chmod +x node_modules/.bin/*
pm2 delete nedico.net || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs nedico.net --lines 50
```

یا از UI سی‌پنل: Stop → Start (با `NODE_ENV=production`).

### 8.3 نکات cPanel Node.js App

- Application root = ریشه پروژه روی سرور
- Application startup file = `server.js`
- نسخه Node = 20.x
- متغیرهای محیطی می‌توانند در UI cPanel هم تعریف شوند (بر فایل `.env` اولویت دارند چون لودر فقط کلیدهای خالی را پر می‌کند)

---

## 9. پنل ادمین استقرار

| جزء | مسیر |
|-----|------|
| UI | `/admin/server` → `app/admin/server/page.tsx` |
| API | `GET/POST /api/admin/deploy` |
| ذخیره | Mongo `Setting` با کلید `deploy_config` |
| منطق | `lib/admin/deploy-config.ts` |

### 9.1 رفتار مهم

- ذخیره در پنل **فقط یک «دستورالعمل» داخل Mongo** است.
- **فایل `.env` واقعی روی دیسک نوشته نمی‌شود.**
- ادمین متن `.env` تولیدشده را کپی می‌کند و روی سرور دستی می‌گذارد، سپس اپ را ریستارت می‌کند.
- `MONGODB_URI` عمداً از پنل قابل ویرایش نیست (فقط روی سرور).

### 9.2 خروجی‌های پنل

1. فرم تنظیمات (`DeployConfig`)
2. متن `.env` از `buildEnvFile()` — **بدون** `UPLOADS_DIR` و SMS (باید دستی اضافه شوند)
3. دستورات `buildStartCommands()`: install / build / start / pm2
4. کارت runtime: port، وضعیت Mongo (URI ماسک)، وجود `AUTH_SECRET`، وجود سامان

### 9.3 API

**`GET /api/admin/deploy`** (ADMIN)

```json
{
  "config": { "port": 3000, "authSecret": "...", "...": "..." },
  "runtime": {
    "port": 3000,
    "nodeEnv": "production",
    "mongoStatus": "connected",
    "mongoUriMasked": "mongodb://user:***@host/db",
    "hasAuthSecret": true,
    "hasSaman": false
  }
}
```

**`POST /api/admin/deploy`**

```json
{ "config": { /* DeployConfig */ } }
```

→ upsert در `Setting` با کلید `deploy_config`.

---

## 10. Cron و عملیات پس‌زمینه

| مکانیزم | مسیر | احراز هویت |
|---------|------|------------|
| انقضای پرداخت | `GET/POST` → `app/api/cron/expire-payments/route.ts` | اگر `CRON_SECRET` set باشد: هدر `x-cron-secret` |
| بکاپ زمان‌بندی‌شده | `lib/admin/backup.ts` + `node-cron` | تنظیمات DB؛ init از ادمین |

در `server.js` تلاش برای `require('./lib/admin/backup.ts')` معمولاً در production skip می‌شود (TS بدون transpile). بکاپ عملاً از مسیر ادمین/Next init می‌شود.

برای پورت: کرون‌های HTTP را با secret اجباری در production طراحی کنید؛ secret خالی = endpoint باز.

---

## 11. چک‌لیست استقرار

### قبل از آپلود

- [ ] `npm ci` روی Linux/WSL
- [ ] `npm run build` موفق
- [ ] CSS در `.next/static/css` بدون `@tailwind` خام
- [ ] `npm run deploy:prune`
- [ ] `npm run deploy:check` سبز
- [ ] SWC لینوکس در `node_modules` موجود است

### روی سرور

- [ ] پوشه اپ و `uploads/` ساخته شده
- [ ] فایل `.env` با حداقل: `MONGODB_URI`, `AUTH_SECRET`, `APP_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `UPLOADS_DIR`, `PORT`, `NODE_ENV`
- [ ] `chmod +x node_modules/.bin/*`
- [ ] PM2 start / cPanel Start
- [ ] `GET /api/health` → `ok: true` و Mongo connected
- [ ] تست لاگین ادمین
- [ ] تست آپلود تصویر (نوشتن در `UPLOADS_DIR`)
- [ ] در production: تنظیم `SAMAN_*` اگر پرداخت زنده لازم است
- [ ] تنظیم `CRON_SECRET` و زمان‌بندی کرون انقضای پرداخت

### بعد از هر Redeploy

- [ ] `.env` و `uploads/` را overwrite نکنید
- [ ] فقط آرتیفکت‌های بیلد را جایگزین کنید
- [ ] `pm2 restart <name>` یا Stop/Start در cPanel

---

## 12. الگوی قابل‌استفاده در پروژه دیگر

برای پیاده‌سازی مشابه در محصول دیگر، این قطعات را کپی/بازنویسی کنید:

### حداقل فایل‌ها

```text
server.js                          # custom server + loadEnvFile + uploads static
ecosystem.config.cjs               # PM2
server/config/env.ts               # Zod typed env
lib/db/mongo-config.ts + .cjs     # resolve/mask URI
lib/admin/upload-storage.ts + .cjs # UPLOADS_DIR اجباری
lib/admin/deploy-config.ts         # تولید .env و دستورات
app/api/admin/deploy/route.ts      # API وضعیت + ذخیره دستورالعمل
app/admin/server/page.tsx          # UI
scripts/build-production.js
scripts/prepare-cpanel-deploy.js
scripts/run-dev.js
.env.example
```

### قراردادهای پیشنهادی برای محصول جدید

1. **یک custom server** که `.env` را قبل از Next لود کند.
2. **`UPLOADS_DIR` مطلق و خارج از پوشه دیپلوی** تا با آپلود نسخه جدید پاک نشود.
3. **بیلد روی همان OS سرور**؛ آپلود آرتیفکت، نه سورس کامل.
4. **پنل ادمین فقط دستورالعمل** بسازد؛ نوشتن `.env` روی دیسک را از وب‌اپ نکنید (امنیت).
5. **Zod فقط برای متغیرهای کسب‌وکار**؛ secrets حیاتی را جدا چک کنید و در health نشان دهید.
6. **`MONGODB_URI` را در UI ادمین قابل‌ویرایش نکنید.**
7. نام PM2، مسیر home، و پورت را از hardcode خارج و قابل‌پیکربندی کنید.
8. در production، درگاه پرداخت mock را غیرفعال کنید (مثل همین پروژه).

```mermaid
flowchart TB
  subgraph Reuse["الگوی قابل‌استفاده مجدد"]
    E[.env روی سرور]
    L[loadEnvFile در boot]
    V[Zod env module]
    U[UPLOADS_DIR مطلق]
    B[Build محلی Linux]
    P[PM2 / process manager]
    A[Admin deploy recipe فقط]
  end
  E --> L --> V
  L --> U
  B --> P
  A -.->|کپی دستی| E
```

---

## 13. نقشه فایل‌ها

```text
server.js
ecosystem.config.cjs
package.json
next.config.js
.npmrc
.env.example
deploy-manifest.txt                 # خروجی deploy:check

server/config/env.ts
server/config/index.ts

lib/db/mongo-config.ts
lib/db/mongo-config.cjs
lib/db/mongoose.ts
lib/admin/upload-storage.ts
lib/admin/upload-storage.cjs
lib/admin/deploy-config.ts
lib/auth/token.ts                   # AUTH_SECRET
lib/payment/gateway-factory.ts      # prod → SEP
lib/payment/sep-gateway.ts
lib/admin/sms-settings.ts           # SMS_IR_* fallback
lib/seo/site-url.ts                 # NEXT_PUBLIC_SITE_URL
lib/price-portal/security.ts        # SITE_URL / NEXT_PUBLIC_SITE_URL

app/admin/server/page.tsx
app/api/admin/deploy/route.ts
app/api/health/route.ts
app/api/cron/expire-payments/route.ts

scripts/build-production.js
scripts/run-dev.js
scripts/prepare-cpanel-deploy.js
scripts/check-mongo.js
```

---

## 14. نکات و دام‌ها

| موضوع | واقعیت |
|-------|--------|
| پنل ادمین ≠ env زنده | ذخیره `deploy_config` فایل `.env` را عوض نمی‌کند |
| `buildEnvFile` ناقص است | `UPLOADS_DIR` و SMS را تولید نمی‌کند — دستی اضافه کنید |
| `SAMAN_TERMINAL_PASS` | در UI/template هست؛ در کد درگاه استفاده نمی‌شود |
| `AUTH_SECRET` خالی | fallback ناامن `dev-secret-change-me` |
| `CRON_SECRET` خالی | کرون انقضای پرداخت بدون احراز هویت |
| Backup cron از `server.js` | اغلب skip می‌شود |
| `.env.example` | ممکن است gitignore شده باشد — در پورت track کنید |
| Windows → Linux node_modules | SWC اشتباه؛ بیلد لینوکسی لازم است |
| Build بعد از prune روی سرور | CSS می‌شکند |
| `NEXT_PUBLIC_*` | در بیلد Next ممکن است inline شود؛ برای URL عمومی، هم env سرور و هم rebuild را در نظر بگیرید |

---

## پیوست A — جدول «کجا مصرف می‌شود»

| متغیر | مصرف‌کننده‌های اصلی |
|-------|---------------------|
| `PORT` / `HOSTNAME` | `server.js`, PM2, admin runtime |
| `NODE_ENV` | cookies secure، gateway، middleware، uploads، mongo default |
| `MONGODB_URI` | `mongo-config`, `mongoose`, health, deploy runtime |
| `AUTH_SECRET` | `lib/auth/token.ts` |
| `APP_BASE_URL` | پرداخت، verify redirect، orchestrator |
| `NEXT_PUBLIC_SITE_URL` | SEO، site settings، price-portal |
| `UPLOADS_DIR` | upload-storage، `server.js` |
| `SAMAN_*` | `sep-gateway`, env Zod |
| `PAYMENT_TAX_RATE` | invoice-service |
| `WALLET_MIN_WITHDRAWAL` | wallet-service |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | invoice / wallet / checkout |
| `CRON_SECRET` | expire-payments |
| `SMS_IR_*` | sms-settings fallback |

---

## پیوست B — توالی بوت Production

```mermaid
sequenceDiagram
  participant PM2
  participant SJ as server.js
  participant FS as .env file
  participant UP as UPLOADS_DIR
  participant NX as Next.js

  PM2->>SJ: start script
  SJ->>FS: loadEnvFile(.env) then .env.local
  SJ->>SJ: default NODE_ENV=production
  SJ->>SJ: applyMongoEnvDefaults + resolveMongoUri (log masked)
  SJ->>SJ: assert .next exists
  SJ->>UP: resolveUploadsRoot (fail if missing)
  SJ->>UP: mkdir folders
  SJ->>NX: next({ dev:false }).prepare()
  SJ->>SJ: HTTP listen(PORT, HOSTNAME)
  Note over SJ: /uploads/* served from disk<br/>else Next handler
```

---

*این سند فقط از روی کد و اسکریپت‌های موجود استخراج شده و برای استفاده به‌عنوان مرجع معماری در محصول دیگر نوشته شده است.*
