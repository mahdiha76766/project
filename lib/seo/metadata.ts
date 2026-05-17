import type { Metadata } from 'next';

export const buildMetadata = (title: string, description: string): Metadata => ({
  title,
  description,
  openGraph: { title, description, type: 'website' }
});
