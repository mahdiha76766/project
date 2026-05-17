import { z } from 'zod';
import { USER_ROLES } from '@/constants/roles';

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid object id');

export const userCreateSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default('CUSTOMER')
});

export const productCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  shortDescription: z.string().min(5),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative()
});
