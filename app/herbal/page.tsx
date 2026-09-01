import type { Metadata } from 'next';
import { FeedarFamilyPage, familyPageMetadata } from '@/components/feedar/products/FamilyPage';

export async function generateMetadata(): Promise<Metadata> {
  return familyPageMetadata('HERBAL');
}

export default function HerbalPage() {
  return <FeedarFamilyPage line="HERBAL" />;
}
