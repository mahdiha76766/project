import { NextResponse } from 'next/server';
import { DownloadAsset } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await DownloadAsset.find({ isActive: true })
      .populate('relatedProduct', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
