import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { getSitePageContent, saveSitePageContent } from '@/lib/admin/page-content';
import { normalizeSitePageContent, type SitePageContent } from '@/lib/admin/page-content-config';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const content = await getSitePageContent();
  return NextResponse.json({ content });
}

export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const current = await getSitePageContent();
    const partial = (body.content || {}) as Partial<SitePageContent>;
    const merged = normalizeSitePageContent({
      ...current,
      ...partial,
      header: partial.header ? { ...current.header, ...partial.header } : current.header,
      footer: partial.footer ? { ...current.footer, ...partial.footer } : current.footer,
      home: partial.home
        ? {
            ...current.home,
            ...partial.home,
            productSections: partial.home.productSections ?? current.home.productSections
          }
        : current.home,
      contact: partial.contact ? { ...current.contact, ...partial.contact } : current.contact
    });
    const saved = await saveSitePageContent(merged);
    return NextResponse.json({ content: saved, message: 'محتوا ذخیره شد.' });
  } catch (e) {
    console.error('[admin][site-content]', e);
    return NextResponse.json({ error: 'ذخیره ناموفق بود.' }, { status: 500 });
  }
}
