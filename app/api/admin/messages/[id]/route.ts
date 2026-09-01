import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ContactInquiry } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireContent } from '@/lib/api/guards';
import { deleteDocByAnyId, updateDocByAnyId } from '@/lib/db/find-by-any-id';

const patchSchema = z.object({
  status: z.enum(['NEW', 'READ']).optional()
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'درخواست نامعتبر است.' }, { status: 400 });
  await connectToDatabase();
  const item = await updateDocByAnyId(ContactInquiry, id, parsed.data);
  if (!item) return NextResponse.json({ error: 'پیام یافت نشد.' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const { id } = await params;
  await connectToDatabase();
  await deleteDocByAnyId(ContactInquiry, id);
  return NextResponse.json({ ok: true });
}
