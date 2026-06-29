import { NextResponse } from 'next/server';
import { getSitePageContent } from '@/lib/admin/page-content';

export async function GET() {
  const content = await getSitePageContent();
  return NextResponse.json({ content });
}
