import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^09\d{9}$/),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  mobile: z.string().regex(/^09\d{9}$/),
  password: z.string().min(8)
});
