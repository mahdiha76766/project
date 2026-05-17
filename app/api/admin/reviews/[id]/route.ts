import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Review } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

const updateSchema = z.object({ rating: z.number().min(1).max(5).optional(), title: z.string().min(3).optional(), comment: z.string().min(10).optional(), adminReply: z.string().max(2000).optional(), status: z.enum(['PENDING','APPROVED','REJECTED']).optional(), action: z.enum(['approve','reject','soft_delete']).optional() });
async function guard(){const u=await getSessionUser(); return u && hasMinimumRole(u.role,'ADMIN');}

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await guard())) return NextResponse.json({error:'Forbidden'},{status:403});
  const {id}=await params; const body=updateSchema.parse(await req.json()); await connectToDatabase();
  const update: Record<string, unknown> = {};
  if (body.rating !== undefined) update.rating = body.rating;
  if (body.title !== undefined) update.title = body.title;
  if (body.comment !== undefined) update.comment = body.comment;
  if (body.adminReply !== undefined) update.adminReply = body.adminReply;
  if (body.status !== undefined) update.status = body.status;
  if (body.action === 'approve') update.status = 'APPROVED';
  if (body.action === 'reject') update.status = 'REJECTED';
  if (body.action === 'soft_delete') update.isDeleted = true;
  if (body.rating !== undefined || body.title !== undefined || body.comment !== undefined) update.editedByAdmin = true;
  const item=await Review.findByIdAndUpdate(id,update,{new:true});
  return NextResponse.json({item});
}
