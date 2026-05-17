import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Review, BlogComment } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

const querySchema = z.object({
  type: z.enum(['product', 'blog', 'all']).optional(),
  productId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['PENDING','APPROVED','REJECTED']).optional(),
  rating: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}

export async function GET(req: Request){
  if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403});
  const url = new URL(req.url);
  const parsed = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
  await connectToDatabase();

  const items: any[] = [];

  if (parsed.type !== 'blog') {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (parsed.productId) filter.productId = parsed.productId;
    if (parsed.userId) filter.userId = parsed.userId;
    if (parsed.status) filter.status = parsed.status;
    if (parsed.rating) filter.rating = Number(parsed.rating);
    if (parsed.dateFrom || parsed.dateTo) filter.createdAt = { ...(parsed.dateFrom ? { $gte: new Date(parsed.dateFrom) } : {}), ...(parsed.dateTo ? { $lte: new Date(parsed.dateTo) } : {}) };

    const productReviews = await Review.find(filter).populate('productId','name').populate('userId','name mobile').sort({createdAt:-1}).lean();
    items.push(...productReviews.map((x: any) => ({ ...x, reviewType: 'product' })));
  }

  if (parsed.type !== 'product') {
    const blogFilter: Record<string, unknown> = {};
    if (parsed.userId) blogFilter.userId = parsed.userId;
    if (parsed.status) blogFilter.isApproved = parsed.status === 'APPROVED';
    if (parsed.dateFrom || parsed.dateTo) blogFilter.createdAt = { ...(parsed.dateFrom ? { $gte: new Date(parsed.dateFrom) } : {}), ...(parsed.dateTo ? { $lte: new Date(parsed.dateTo) } : {}) };

    const blogComments = await BlogComment.find(blogFilter).populate('postId', 'title slug').sort({ createdAt: -1 }).lean();
    items.push(...blogComments.map((x: any) => ({
      _id: x._id,
      title: 'دیدگاه بلاگ',
      comment: x.comment,
      rating: '-',
      status: x.isApproved ? 'APPROVED' : 'PENDING',
      adminReply: '',
      createdAt: x.createdAt,
      userName: x.userName,
      productId: { name: `بلاگ: ${x.postId?.title || '-'}` },
      reviewType: 'blog'
    })));
  }

  items.sort((a,b)=> new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  return NextResponse.json({items});
}
