export type ParsedUserAgent = {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceVendor: string;
  deviceModel: string;
  /** Human-readable one-liner, e.g. "Chrome 120 · Windows 11 · Desktop" */
  label: string;
};

function matchOne(ua: string, re: RegExp): string {
  const m = ua.match(re);
  return m?.[1]?.trim() || '';
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  if (!ua) {
    return {
      deviceType: 'unknown',
      browser: 'نامشخص',
      browserVersion: '',
      os: 'نامشخص',
      osVersion: '',
      deviceVendor: '',
      deviceModel: '',
      label: 'نامشخص'
    };
  }

  const lower = ua.toLowerCase();

  // --- Device type & vendor/model ---
  let deviceType: ParsedUserAgent['deviceType'] = 'unknown';
  let deviceVendor = '';
  let deviceModel = '';

  if (/ipad/i.test(ua)) {
    deviceType = 'tablet';
    deviceVendor = 'Apple';
    deviceModel = 'iPad';
  } else if (/iphone/i.test(ua)) {
    deviceType = 'mobile';
    deviceVendor = 'Apple';
    deviceModel = 'iPhone';
  } else if (/android/i.test(ua)) {
    const model = matchOne(ua, /;\s*([^;)]+)\s+build\//i) || matchOne(ua, /android[^;]*;\s*([^)]+)\)/i);
    deviceVendor = /samsung|sm-/i.test(ua) ? 'Samsung' : /xiaomi|redmi|mi\s/i.test(ua) ? 'Xiaomi' : /huawei|honor/i.test(ua) ? 'Huawei' : 'Android';
    deviceModel = model.replace(/_/g, ' ').trim() || 'Android';
    deviceType = /mobile/i.test(ua) || (!/tablet/i.test(ua) && model.length < 30) ? 'mobile' : 'tablet';
    if (/tablet/i.test(ua)) deviceType = 'tablet';
  } else if (/windows phone/i.test(ua)) {
    deviceType = 'mobile';
    deviceVendor = 'Microsoft';
    deviceModel = 'Windows Phone';
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceType = /mobile|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
    deviceVendor = 'Apple';
    deviceModel = deviceType === 'desktop' ? 'Mac' : 'iOS';
  } else if (/windows nt/i.test(ua)) {
    deviceType = 'desktop';
    deviceVendor = 'Microsoft';
    deviceModel = 'PC';
  } else if (/linux|cros|x11/i.test(ua)) {
    deviceType = /mobile/i.test(ua) ? 'mobile' : 'desktop';
    deviceVendor = /cros/i.test(ua) ? 'Google' : 'Linux';
    deviceModel = /cros/i.test(ua) ? 'Chromebook' : 'PC';
  }

  // --- OS ---
  let os = 'نامشخص';
  let osVersion = '';

  if (/windows nt 10/i.test(ua)) {
    os = 'Windows';
    osVersion = /windows nt 10\.0/i.test(ua) ? '10/11' : '10';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = 'Windows';
    osVersion = '7';
  } else if (/mac os x ([\d_]+)/i.test(ua)) {
    os = 'macOS';
    osVersion = matchOne(ua, /mac os x ([\d_]+)/i).replace(/_/g, '.');
  } else if (/iphone os ([\d_]+)/i.test(ua)) {
    os = 'iOS';
    osVersion = matchOne(ua, /iphone os ([\d_]+)/i).replace(/_/g, '.');
  } else if (/cpu os ([\d_]+)/i.test(ua) && /ipad/i.test(ua)) {
    os = 'iPadOS';
    osVersion = matchOne(ua, /cpu os ([\d_]+)/i).replace(/_/g, '.');
  } else if (/android ([\d.]+)/i.test(ua)) {
    os = 'Android';
    osVersion = matchOne(ua, /android ([\d.]+)/i);
  } else if (/cros/i.test(ua)) {
    os = 'Chrome OS';
    osVersion = matchOne(ua, /cros [\w]+ ([\d.]+)/i);
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // --- Browser ---
  let browser = 'نامشخص';
  let browserVersion = '';

  if (/edg\//i.test(ua) || /edga\//i.test(ua) || /edgios/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = matchOne(ua, /edg[eaios]*\/([\d.]+)/i);
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
    browserVersion = matchOne(ua, /(?:opr|opera)\/([\d.]+)/i);
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
    browserVersion = matchOne(ua, /samsungbrowser\/([\d.]+)/i);
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
    browserVersion = matchOne(ua, /(?:firefox|fxios)\/([\d.]+)/i);
  } else if (/crios/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = matchOne(ua, /crios\/([\d.]+)/i);
  } else if (/chrome|chromium/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome';
    browserVersion = matchOne(ua, /(?:chrome|chromium)\/([\d.]+)/i);
  } else if (/safari/i.test(ua) && !/chrome|chromium/i.test(ua)) {
    browser = 'Safari';
    browserVersion = matchOne(ua, /version\/([\d.]+)/i);
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer';
    browserVersion = matchOne(ua, /(?:msie |rv:)([\d.]+)/i);
  }

  const typeLabel =
    deviceType === 'mobile' ? 'موبایل' : deviceType === 'tablet' ? 'تبلت' : deviceType === 'desktop' ? 'دسکتاپ' : 'نامشخص';

  const parts = [
    browserVersion ? `${browser} ${browserVersion.split('.')[0]}` : browser,
    osVersion ? `${os} ${osVersion}` : os,
    deviceModel && deviceModel !== 'PC' ? deviceModel : typeLabel
  ].filter(Boolean);

  return {
    deviceType,
    browser,
    browserVersion,
    os,
    osVersion,
    deviceVendor,
    deviceModel,
    label: parts.join(' · ')
  };
}

/** @deprecated use parseUserAgent */
export function detectDevice(ua: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  return parseUserAgent(ua).deviceType;
}
