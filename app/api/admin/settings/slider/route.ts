import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { connectToDatabase } from '@/lib/db/mongoose';
import { Setting } from '@/models/SupportModels';
import { defaultSliderConfig, type HeroSliderConfig } from '@/lib/admin/slider-config';

function readConfig(value: unknown): HeroSliderConfig {
  if (Array.isArray(value) && value.length) {
    return { slides: value as HeroSliderConfig['slides'], autoplayInterval: 6000 };
  }
  if (value && typeof value === 'object' && Array.isArray((value as HeroSliderConfig).slides)) {
    return value as HeroSliderConfig;
  }
  return defaultSliderConfig;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const setting = await Setting.findOne({ key: 'home_hero_slides' }).lean() as { value?: unknown } | null;
  const config = readConfig(setting?.value);
  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await connectToDatabase();
  const body = await req.json();
  const slides = Array.isArray(body.slides) ? body.slides : [];
  const autoplayInterval = Number(body.autoplayInterval) || 6000;
  const value: HeroSliderConfig = { slides, autoplayInterval };
  await Setting.findOneAndUpdate({ key: 'home_hero_slides' }, { value }, { upsert: true, new: true });
  return NextResponse.json({ ok: true });
}
