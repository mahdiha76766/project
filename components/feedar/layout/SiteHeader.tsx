'use client';

import { useState } from 'react';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { FeedarHeader, FeedarMobileMenu } from '@/components/feedar/layout/HeaderParts';

import { socialsFromContact } from '@/lib/feedar/socials';

export function FeedarSiteChromeHeader() {
  const [open, setOpen] = useState(false);
  const { content } = useSiteContent();
  const socials = socialsFromContact(content.contact);

  return (
    <>
      <FeedarHeader brandName={content.header.brandName} socials={socials} onOpenMenu={() => setOpen(true)} />
      <FeedarMobileMenu open={open} onClose={() => setOpen(false)} brandName={content.header.brandName} />
    </>
  );
}
