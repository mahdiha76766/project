import { z } from 'zod';
import { normalizeMobile } from './mobile';

const mobileField = z
  .string()
  .transform(normalizeMobile)
  .pipe(z.string().regex(/^09\d{9}$/, 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود'));

const passwordField = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .max(128, 'رمز عبور نباید بیش از ۱۲۸ کاراکتر باشد')
  .regex(/[a-zA-Z\u0600-\u06FF]/, 'رمز عبور باید شامل حروف باشد')
  .regex(/\d/, 'رمز عبور باید شامل عدد باشد');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(80),
  mobile: mobileField,
  email: z.string().trim().toLowerCase().email('ایمیل معتبر نیست'),
  password: passwordField
});

export const loginSchema = z.object({
  mobile: mobileField,
  password: z.string().min(1, 'رمز عبور الزامی است').max(128)
});
