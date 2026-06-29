import { getCaptchaSettings, isCaptchaRequired, type CaptchaScope } from '@/lib/admin/captcha-settings';
import { verifyMathCaptchaAnswer } from '@/lib/captcha/math-captcha';

export async function verifyCaptchaFromBody(
  body: Record<string, unknown>,
  scope: CaptchaScope
) {
  const settings = await getCaptchaSettings();
  if (!isCaptchaRequired(settings, scope)) {
    return { ok: true as const };
  }

  return verifyMathCaptchaAnswer(
    String(body.captchaToken || ''),
    body.captchaAnswer
  );
}
