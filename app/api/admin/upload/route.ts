import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { saveAdminImage } from '@/lib/admin/image-upload';
import { saveAdminMedia } from '@/lib/admin/media-upload';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = String(formData.get('folder') || 'products');
    if (!file) return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 });

    const mode = String(formData.get('mode') || 'auto');
    const result =
      mode === 'media'
        ? await saveAdminMedia(file, folder)
        : { ...(await saveAdminImage(file, folder)), type: 'image' as const };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[admin][upload]', error);
    return NextResponse.json({ error: error?.message || 'آپلود ناموفق بود.' }, { status: 400 });
  }
}
