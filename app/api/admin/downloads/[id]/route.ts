import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';
import { DownloadAsset, Product } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { requireContent } from '@/lib/api/guards';
import { deleteDocByAnyId, updateDocByAnyId } from '@/lib/db/find-by-any-id';

const updateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(800).optional(),
  fileUrl: z.string().trim().min(1).max(2000).optional(),
  fileName: z.string().trim().max(240).optional(),
  fileSize: z.number().min(0).optional(),
  mimeType: z.string().trim().max(120).optional(),
  kind: z.enum(['pdf', 'brochure', 'catalog', 'info']).optional(),
  relatedProduct: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional()
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'اطلاعات نامعتبر است.' }, { status: 400 });
  }
  await connectToDatabase();
  const payload = { ...parsed.data } as Record<string, unknown>;
  if ('relatedProduct' in parsed.data) {
    const raw = parsed.data.relatedProduct;
    if (!raw) payload.relatedProduct = null;
    else if (!isValidObjectId(raw)) return NextResponse.json({ error: 'شناسه محصول نامعتبر است.' }, { status: 400 });
    else {
      const exists = await Product.exists({ _id: raw });
      if (!exists) return NextResponse.json({ error: 'محصول مرتبط یافت نشد.' }, { status: 400 });
      payload.relatedProduct = raw;
    }
  }

  const item = await updateDocByAnyId(DownloadAsset, id, payload);
  if (!item) return NextResponse.json({ error: 'فایل یافت نشد.' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const { id } = await params;
  await connectToDatabase();
  await deleteDocByAnyId(DownloadAsset, id);
  return NextResponse.json({ ok: true });
}
