import 'server-only';

import { Setting } from '@/models/SupportModels';
import { connectToDatabase } from '@/lib/db/mongoose';
import {
  SITE_PAGE_CONTENT_KEY,
  defaultSitePageContent,
  normalizeSitePageContent,
  type SitePageContent
} from '@/lib/admin/page-content-config';

export type { SitePageContent } from '@/lib/admin/page-content-config';
export {
  SITE_PAGE_CONTENT_KEY,
  defaultSitePageContent,
  normalizeSitePageContent
} from '@/lib/admin/page-content-config';

export async function getSitePageContent(): Promise<SitePageContent> {
  try {
    await connectToDatabase();
    const row = await Setting.findOne({ key: SITE_PAGE_CONTENT_KEY }).lean() as { value?: unknown } | null;
    return normalizeSitePageContent(row?.value);
  } catch {
    return defaultSitePageContent;
  }
}

export async function saveSitePageContent(value: SitePageContent) {
  await connectToDatabase();
  const normalized = normalizeSitePageContent(value);
  await Setting.findOneAndUpdate(
    { key: SITE_PAGE_CONTENT_KEY },
    { value: normalized },
    { upsert: true, new: true }
  );
  return normalized;
}
