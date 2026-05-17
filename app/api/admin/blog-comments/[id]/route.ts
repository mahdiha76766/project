import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BlogComment } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

const schema = z.object({
  action: z.enum(['approve', 'reject', 'soft_delete']).optional(),
  comment: z.string().min(5).max(1000).optional()
});

async function guard() {
  const u = await getSessionUser();
  return u && hasMinimumRole(u.role, 'ADMIN');
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = schema.parse(await req.json());
  await connectToDatabase();

  const update: Record<string, unknown> = {};
  if (body.comment !== undefined) update.comment = body.comment;
  if (body.action === 'approve') update.status = 'APPROVED';
  if (body.action === 'reject') update.status = 'REJECTED';
  if (body.action === 'soft_delete') update.isDeleted = true;

  const item = await BlogComment.findByIdAndUpdate(id, update, { new: true });
  return NextResponse.json({ item });
}
