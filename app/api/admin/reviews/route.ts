import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Review } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

const querySchema = z.object({ productId: z.string().optional(), userId: z.string().optional(), status: z.enum(['PENDING','APPROVED','REJECTED']).optional(), rating: z.string().optional(), dateFrom: z.string().optional(), dateTo: z.string().optional() });
async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}

export async function GET(req: Request){
  if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403});
  const url = new URL(req.url);
  const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
  await connectToDatabase();

  const filter: Record<string, unknown> = { isDeleted: false };
  if (parsed.productId) filter.productId = parsed.productId;
  if (parsed.userId) filter.userId = parsed.userId;
  if (parsed.status) filter.status = parsed.status;
  if (parsed.rating) filter.rating = Number(parsed.rating);
  if (parsed.dateFrom || parsed.dateTo) filter.createdAt = { ...(parsed.dateFrom ? { $gte: new Date(parsed.dateFrom) } : {}), ...(parsed.dateTo ? { $lte: new Date(parsed.dateTo) } : {}) };

  const items = await Review.find(filter).populate('productId','name').populate('userId','name mobile').sort({createdAt:-1}).lean();
  return NextResponse.json({items});
}
