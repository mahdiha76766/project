export type DeployConfig = {
  port: number;
  nodeEnv: 'development' | 'production';
  authSecret: string;
  appBaseUrl: string;
  publicSiteUrl: string;
  samanTerminalId: string;
  samanMerchantId: string;
  samanTerminalPass: string;
  samanCallbackUrl: string;
  cronSecret: string;
  orderPaymentTimeoutMinutes: number;
  walletMinWithdrawal: number;
  paymentTaxRate: number;
};

export const DEPLOY_CONFIG_KEY = 'deploy_config';

export const defaultDeployConfig: DeployConfig = {
  port: 3000,
  nodeEnv: 'production',
  authSecret: 'change-me-to-a-long-random-secret',
  appBaseUrl: 'http://localhost:3000',
  publicSiteUrl: 'http://localhost:3000',
  samanTerminalId: '',
  samanMerchantId: '',
  samanTerminalPass: '',
  samanCallbackUrl: 'http://localhost:3000/api/payment/verify',
  cronSecret: '',
  orderPaymentTimeoutMinutes: 15,
  walletMinWithdrawal: 10000,
  paymentTaxRate: 0
};

export function buildEnvFile(config: DeployConfig) {
  const lines = [
    '# ─────────────────────────────────────────────',
    '# عصاره طبیعت — تنظیمات محیط اجرا (Next.js)',
    '# این پروژه یک اپلیکیشن Next.js است (فرانت + API با هم)',
    '# فایل را در ریشه پروژه با نام .env.local یا .env ذخیره کنید',
    '# ─────────────────────────────────────────────',
    '',
    '# پورت اجرا (Next.js به‌صورت خودکار PORT را می‌خواند)',
    `PORT=${config.port}`,
    `NODE_ENV=${config.nodeEnv}`,
    '',
    '# دیتابیس MongoDB — فقط در فایل .env روی سرور (از پنل ادمین قابل تغییر نیست)',
    '# MONGODB_URI=mongodb://user:pass@host:port/dbname',
    '',
    '# احراز هویت و آدرس سایت',
    `AUTH_SECRET=${config.authSecret}`,
    `APP_BASE_URL=${config.appBaseUrl}`,
    `NEXT_PUBLIC_SITE_URL=${config.publicSiteUrl}`,
    '',
    '# درگاه پرداخت سامان (SEP)',
    `SAMAN_TERMINAL_ID=${config.samanTerminalId}`,
    `SAMAN_MERCHANT_ID=${config.samanMerchantId}`,
    `SAMAN_TERMINAL_PASS=${config.samanTerminalPass}`,
    `SAMAN_CALLBACK_URL=${config.samanCallbackUrl}`,
    '',
    '# مالی و سفارش',
    `PAYMENT_TAX_RATE=${config.paymentTaxRate}`,
    `WALLET_MIN_WITHDRAWAL=${config.walletMinWithdrawal}`,
    `ORDER_PAYMENT_TIMEOUT_MINUTES=${config.orderPaymentTimeoutMinutes}`,
    '',
    '# کرون انقضای پرداخت (اختیاری)',
    config.cronSecret ? `CRON_SECRET=${config.cronSecret}` : '# CRON_SECRET=',
    ''
  ];
  return lines.join('\n');
}

export function buildStartCommands(config: DeployConfig) {
  const port = config.port;
  return {
    install: 'npm ci && npm run build && npm run deploy:prune',
    build: 'npm run build',
    dev: `PORT=${port} npm run dev`,
    start: `PORT=${port} NODE_ENV=production npm run prod`,
    pm2: 'pm2 start ecosystem.config.cjs',
    pm2Restart: 'pm2 restart nedico.net',
    pm2Logs: 'pm2 logs nedico.net --lines 50'
  };
}
