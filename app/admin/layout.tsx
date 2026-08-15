import type { Metadata } from 'next';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import { privatePageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = privatePageMetadata();

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
