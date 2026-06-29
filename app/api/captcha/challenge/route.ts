import { NextResponse } from 'next/server';
import { createMathCaptchaChallenge } from '@/lib/captcha/math-captcha';

export async function GET() {
  const challenge = await createMathCaptchaChallenge();
  return NextResponse.json(challenge);
}
