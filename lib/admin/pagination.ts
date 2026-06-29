export function getPaginationParams(url: string) {
  const { searchParams } = new URL(url);
  const all = searchParams.get('all') === '1';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(5, Number(searchParams.get('limit') || 10)));
  return { all, page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
