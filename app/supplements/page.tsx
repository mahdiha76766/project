import type { Metadata } from 'next';
import { FeedarFamilyPage, familyPageMetadata } from '@/components/feedar/products/FamilyPage';

export async function generateMetadata(): Promise<Metadata> {
  return familyPageMetadata('SUPPLEMENT');
}

export default function SupplementsPage() {
  return <FeedarFamilyPage line="SUPPLEMENT" />;
}
