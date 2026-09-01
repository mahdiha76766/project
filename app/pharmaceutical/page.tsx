import type { Metadata } from 'next';
import { FeedarFamilyPage, familyPageMetadata } from '@/components/feedar/products/FamilyPage';

export async function generateMetadata(): Promise<Metadata> {
  return familyPageMetadata('PHARMACEUTICAL');
}

export default function PharmaceuticalPage() {
  return <FeedarFamilyPage line="PHARMACEUTICAL" />;
}
