export const CAPTCHA_SETTINGS_KEY = 'captcha_settings';

export type CaptchaSettings = {
  enabled: boolean;
  login: boolean;
  register: boolean;
  otpSend: boolean;
  comments: boolean;
  reviews: boolean;
  contact: boolean;
};

export const defaultCaptchaSettings: CaptchaSettings = {
  enabled: true,
  login: true,
  register: true,
  otpSend: true,
  comments: true,
  reviews: true,
  contact: true
};

export function normalizeCaptchaSettings(raw: unknown): CaptchaSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Partial<CaptchaSettings>;
  return {
    enabled: v.enabled !== false,
    login: v.login !== false,
    register: v.register !== false,
    otpSend: v.otpSend !== false,
    comments: v.comments !== false,
    reviews: v.reviews !== false,
    contact: v.contact !== false
  };
}

export type CaptchaScope = keyof Omit<CaptchaSettings, 'enabled'>;

export function isCaptchaRequired(settings: CaptchaSettings, scope: CaptchaScope) {
  return settings.enabled && settings[scope];
}
