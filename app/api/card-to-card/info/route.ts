import { NextResponse } from 'next/server';
import { getCardToCardSettings, getPublicBankInfo } from '@/lib/admin/card-to-card-settings';

export async function GET() {
  const settings = await getCardToCardSettings();
  return NextResponse.json(getPublicBankInfo(settings));
}
