export function getListSearchQuery(url: string) {
  try {
    return new URL(url).searchParams.get('q')?.trim() || '';
  } catch {
    return '';
  }
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildDocumentSearchFilter(q: string, fields: string[]) {
  if (!q) return {};
  const regex = { $regex: escapeRegex(q), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

export function mergeMongoFilters(...filters: Record<string, unknown>[]) {
  const active = filters.filter((f) => Object.keys(f).length > 0);
  if (!active.length) return {};
  if (active.length === 1) return active[0];
  return { $and: active };
}

export function buildAdminListUrl(endpoint: string, page: number, limit: number, q?: string) {
  const [path, existingQuery = ''] = endpoint.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (q) params.set('q', q);
  else params.delete('q');
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
