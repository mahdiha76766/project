export async function adminFetch<T = unknown>(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { res, data, ok: res.ok, error: !res.ok ? data.error || 'خطا در انجام عملیات' : '' };
}

export function parseAttributes(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('invalid');
    }
    return parsed as Record<string, string>;
  } catch {
    throw new Error('فرمت JSON ویژگی‌ها نامعتبر است.');
  }
}
