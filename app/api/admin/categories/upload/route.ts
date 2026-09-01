import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { requireCatalog } from '@/lib/api/guards';
import { saveAdminImage } from '@/lib/admin/image-upload';

export async function POST(req: Request) {
  const auth = await requireCatalog();
  if (auth.error) return auth.error;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    const result = await saveAdminImage(file, 'categories');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[admin][categories][upload]', error);
    return NextResponse.json({ error: error?.message || 'آپلود ناموفق بود.' }, { status: 400 });
  }
}
