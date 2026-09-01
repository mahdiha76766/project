import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { saveAdminImage } from '@/lib/admin/image-upload';
import { saveAdminMedia } from '@/lib/admin/media-upload';
import { saveAdminPdf } from '@/lib/admin/document-upload';
import { requireContent, requireCatalog, requirePanel } from '@/lib/api/guards';
import { roleHasCapability } from '@/server/permissions';

const CONTENT_FOLDERS = new Set(['blog', 'banners', 'media', 'downloads']);
const CATALOG_FOLDERS = new Set(['products', 'categories']);

export async function POST(req: Request) {
  const auth = await requirePanel();
  if (auth.error) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = String(formData.get('folder') || 'products');
    if (!file) return NextResponse.json({ error: 'فایلی انتخاب نشده است.' }, { status: 400 });

    if (CATALOG_FOLDERS.has(folder) && !roleHasCapability(auth.user.role, 'catalog')) {
      return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
    }
    if (CONTENT_FOLDERS.has(folder) && !roleHasCapability(auth.user.role, 'content')) {
      return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 });
    }

    const mode = String(formData.get('mode') || 'auto');
    if (mode === 'pdf' || folder === 'downloads') {
      const pdfAuth = await requireContent();
      if (pdfAuth.error) return pdfAuth.error;
      const result = await saveAdminPdf(file, folder === 'media' ? 'media' : 'downloads');
      return NextResponse.json(result);
    }

    if (CATALOG_FOLDERS.has(folder)) {
      const catalog = await requireCatalog();
      if (catalog.error) return catalog.error;
    }

    const result =
      mode === 'media'
        ? await saveAdminMedia(file, folder)
        : { ...(await saveAdminImage(file, folder)), type: 'image' as const };
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[admin][upload]', error);
    const message = error instanceof Error ? error.message : 'آپلود ناموفق بود.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
