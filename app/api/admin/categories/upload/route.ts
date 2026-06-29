import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { saveAdminImage } from '@/lib/admin/image-upload';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
