import type { Metadata } from 'next';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = privatePageMetadata();

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
