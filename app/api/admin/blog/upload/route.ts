import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { saveAdminImage } from '@/lib/admin/image-upload';
import { requireContent } from '@/lib/api/guards';

export async function POST(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const result = await saveAdminImage(file, 'blog');
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('[admin][blog][upload]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload failed' }, { status: 500 });
  }
}
